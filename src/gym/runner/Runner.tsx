import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Info, List, SkipForward, Trophy } from 'lucide-react';
import { useGym } from '../store';
import { getSettings, useSettings } from '../../state/settings';
import { db } from '../../db/db';
import { DAY, effectiveTarget, oneRM, trainingMaxes, weekInfo, WAVES } from '../program';
import type { GymExerciseLog, GymSession, GymSet, ProgramConfig } from '../types';
import { setLabel, repsText, loadText, setHowTo, platesText } from './labels';
import { BigNumber } from './BigNumber';
import { nextPending, progress } from './cursor';
import { useNow } from './useNow';
import { unlockAudio } from '../../lib/sound';
import { setKeepAwake } from '../../lib/wakeLock';
import { ask, toast } from '../../ui/uiStore';
import { fmtKg } from '../../lib/format';
import { OverviewSheet } from './OverviewSheet';
import { FinishView } from './FinishView';

const clock = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

function defOf(e: GymExerciseLog) {
  return DAY(e.exId.slice(0, 2) as 'd1').exercises.find((x) => x.id === e.exId);
}

/** Feedback inmediato al completar series clave (calibración y AMRAP). */
async function feedback(session: GymSession, e: GymExerciseLog, s: GymSet) {
  const cfg = (await getSettings()).program;
  if (!cfg || !e.lift) return;
  const others = (await db.gymSessions.toArray()).filter((x) => x.id !== session.id);
  const all = [...others, session];
  if (s.kind === 'top') {
    const rm = oneRM(e.lift, all, cfg);
    const tm = trainingMaxes(e.lift, all, cfg)[0];
    if (rm && tm) toast(`1RM estimado: ${fmtKg(rm.value)} kg · Training Max: ${fmtKg(tm)} kg`, { tone: 'accent', icon: <Trophy size={18} />, duration: 4500 });
  }
  if (s.kind === 'amrap') {
    const info = weekInfo(session.week);
    const w = info.wave ?? 0;
    const tms = trainingMaxes(e.lift, all, cfg);
    const extra = Math.max(0, Math.min((s.reps ?? 0) - WAVES[w].reps, 10));
    const nextName = w < 3 ? `la ola de ${WAVES[w + 1].reps}s` : 'el siguiente ciclo';
    toast(
      extra > 0
        ? `+${extra} reps sobre el mínimo: Training Max sube a ${fmtKg(tms[w + 1] ?? 0)} kg para ${nextName}`
        : `Training Max se mantiene en ${fmtKg(tms[w + 1] ?? 0)} kg para ${nextName}`,
      { tone: 'accent', icon: <Trophy size={18} />, duration: 5000 },
    );
  }
}

function SetView({ session, cfg }: { session: GymSession; cfg: ProgramConfig }) {
  const { ex: ei, set: si } = session.cursor;
  const e = session.exercises[ei];
  const s = e.sets[si];
  const def = defOf(e);
  const target = effectiveTarget(e, s, cfg);
  const prevWeight = [...e.sets.slice(0, si)].reverse().find((x) => x.weight != null)?.weight ?? null;
  const [weight, setWeight] = useState<number | null>(null);
  const [reps, setReps] = useState<number | null>(null);
  const [rir, setRir] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [otherWeight, setOtherWeight] = useState(false);

  useEffect(() => {
    setWeight(s.weight ?? target ?? (s.ask.weight ? prevWeight : null));
    setReps(s.reps ?? s.targetReps);
    setRir(s.rir ?? (s.kind === 'top' ? 2 : null));
    setShowInfo(false);
    setOtherWeight(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.id]);

  const firstOfExercise = si === 0 || e.sets.slice(0, si).every((x) => !x.done && !x.skipped);
  const weightStep = e.kind === 'acc' && def ? Math.max(def.inc, 1) : cfg.rounding;
  const plates = platesText(e, s.ask.weight ? weight : target, cfg);
  const total = session.exercises.length;

  const complete = () => {
    unlockAudio();
    const askW = s.ask.weight || otherWeight;
    if (askW && weight == null) return toast(e.bodyweight ? 'Escribe el lastre (0 si es sin lastre)' : 'Escribe el peso que has usado');
    if (s.ask.reps && (reps == null || reps < 0)) return toast('Escribe las repeticiones');
    const now = Date.now();
    let done!: GymSession;
    useGym.getState().mutate((x) => {
      const set = x.exercises[ei].sets[si];
      set.weight = askW ? weight : target;
      set.reps = s.ask.reps ? reps : s.targetReps;
      set.rir = s.ask.rir ? rir : null;
      set.done = true;
      set.skipped = false;
      set.doneAt = now;
      const nxt = nextPending(x, { ex: ei, set: si + 1 });
      if (nxt) {
        x.cursor = nxt;
        x.rest = set.restSec > 0 ? { endsAt: now + set.restSec * 1000, duration: set.restSec } : null;
      } else {
        x.cursor = { ex: x.exercises.length, set: 0 };
        x.rest = null;
      }
      done = x;
    });
    void feedback(done, done.exercises[ei], done.exercises[ei].sets[si]);
  };

  const skip = () =>
    useGym.getState().mutate((x) => {
      x.exercises[ei].sets[si].skipped = true;
      const nxt = nextPending(x, { ex: ei, set: si + 1 });
      x.cursor = nxt ?? { ex: x.exercises.length, set: 0 };
      x.rest = null;
    });

  return (
    <div className="rset" key={s.id}>
      <div className="rset__ex">
        <span className="rset__count">
          Ejercicio {ei + 1} de {total}
        </span>
        <h2 className="rset__name">{e.name}</h2>
        {def?.note && <span className="rset__note">{def.note}</span>}
      </div>
      {(firstOfExercise || showInfo) && (
        <div className="rset__what">
          <span className="rset__what-k">Qué hacer</span>
          <p>{e.instructions}</p>
        </div>
      )}
      <div className={`rset__card rset__card--${s.kind}`}>
        <div className="rset__label">
          <span>{setLabel(e, si)}</span>
          {!firstOfExercise && (
            <button className="icon-btn icon-btn--muted" onClick={() => setShowInfo((v) => !v)} aria-label="Ver qué hacer">
              <Info size={18} />
            </button>
          )}
        </div>
        <div className="rset__target">
          <b>{loadText(e, s, cfg)}</b>
          <span>× {repsText(e, s)}</span>
          {s.targetRir && s.kind !== 'amrap' && s.kind !== 'plus' && <small>RIR {s.targetRir}</small>}
        </div>
        {plates && <div className="rset__plates">{plates}</div>}
        <p className="rset__how">{setHowTo(e, s, e.kind === 'acc' && e.phase !== 'descarga' ? def?.inc : undefined)}</p>
      </div>

      {(s.ask.weight || s.ask.reps || s.ask.rir || otherWeight) && (
        <div className="rset__inputs">
          {(s.ask.weight || otherWeight) && (
            <BigNumber
              label={e.bodyweight ? 'Lastre (kg) · negativo = asistida' : 'Peso (kg)'}
              value={weight}
              onChange={setWeight}
              step={weightStep}
              min={e.bodyweight ? -200 : 0}
            />
          )}
          {s.ask.reps && <BigNumber label="Repeticiones" value={reps} onChange={setReps} decimal={false} />}
          {s.ask.rir && <BigNumber label="RIR (reps en reserva)" value={rir} onChange={setRir} step={1} />}
        </div>
      )}

      <div className="rset__actions">
        <button className="btn btn--primary btn--block btn--lg" onClick={complete}>
          Serie hecha
        </button>
        {!s.ask.weight && !otherWeight && target != null && (
          <button className="link-btn rset__other" onClick={() => setOtherWeight(true)}>
            He usado otro peso
          </button>
        )}
        <button className="btn btn--danger-plain rset__skip" onClick={skip}>
          <SkipForward size={16} /> Saltar esta serie
        </button>
      </div>
    </div>
  );
}

function RestView({ session, cfg }: { session: GymSession; cfg: ProgramConfig }) {
  const rest = session.rest!;
  const now = useNow(true, 250);
  const left = Math.max(0, (rest.endsAt - now) / 1000);
  const pct = Math.min(1, 1 - left / rest.duration);
  const { ex: ei, set: si } = session.cursor;
  const e = session.exercises[ei];
  const s = e?.sets[si];
  // Ejercicio de la última serie hecha: si cambia, se avisa de que empieza otro ejercicio.
  let lastEx = -1;
  let lastAt = 0;
  session.exercises.forEach((x, i) => x.sets.forEach((y) => {
    if ((y.doneAt ?? 0) > lastAt) {
      lastAt = y.doneAt!;
      lastEx = i;
    }
  }));
  const newExercise = lastEx !== -1 && lastEx !== ei;
  const R = 108;
  const C = 2 * Math.PI * R;
  const adjust = (d: number) =>
    useGym.getState().mutate((x) => {
      if (!x.rest) return;
      x.rest.endsAt += d * 1000;
      x.rest.duration = Math.max(1, x.rest.duration + d);
      if (x.rest.endsAt <= Date.now()) x.rest = null;
    });
  return (
    <div className="rrest">
      <span className="rrest__k">Descanso</span>
      <div className="rrest__ring">
        <svg width={250} height={250} viewBox="0 0 250 250">
          <circle cx={125} cy={125} r={R} className="rrest__track" />
          <circle cx={125} cy={125} r={R} className="rrest__fill" strokeDasharray={C} strokeDashoffset={C * pct} transform="rotate(-90 125 125)" />
        </svg>
        <span className="rrest__time">{clock(Math.ceil(left))}</span>
      </div>
      <div className="rrest__btns">
        <button className="rrest__btn" onClick={() => adjust(-15)}>
          −15 s
        </button>
        <button className="rrest__btn rrest__btn--skip" onClick={() => useGym.getState().mutate((x) => void (x.rest = null))}>
          Saltar descanso
        </button>
        <button className="rrest__btn" onClick={() => adjust(15)}>
          +15 s
        </button>
      </div>
      {e && s && (
        <div className="rrest__next">
          <span className="rrest__next-k">{newExercise ? 'Siguiente ejercicio' : 'A continuación'}</span>
          <b>{e.name}</b>
          <span>
            {setLabel(e, si)} · {loadText(e, s, cfg)} × {repsText(e, s)}
          </span>
          {newExercise && <p>{e.instructions}</p>}
        </div>
      )}
    </div>
  );
}

export function Runner() {
  const session = useGym((x) => x.session);
  const expanded = useGym((x) => x.expanded);
  const s0 = useSettings();
  const now = useNow(!!session && expanded, 1000);
  const [overview, setOverview] = useState(false);

  useEffect(() => {
    setKeepAwake(!!session);
  }, [session]);

  // Cuando acaba el descanso, se pasa solo a la siguiente serie.
  const resting = !!session?.rest && session.rest.endsAt > now;
  const finished = useMemo(() => !!session && nextPending(session, { ex: 0, set: 0 }) === null, [session]);

  if (!session || !s0.program) return <div className="runner" aria-hidden />;
  const p = progress(session);
  const info = weekInfo(session.week);

  const close = async () => {
    const r = await ask({
      title: '¿Descartar la sesión?',
      message: 'Se borrará lo registrado en esta sesión.',
      confirmText: 'Descartar',
      destructive: true,
    });
    if (r === 'confirm') await useGym.getState().discard();
  };

  return (
    <div className={`runner ${expanded ? 'is-open' : ''}`} aria-hidden={!expanded}>
      <header className="runner__head">
        <button className="icon-btn" onClick={() => useGym.getState().setExpanded(false)} aria-label="Minimizar">
          <ChevronDown size={28} />
        </button>
        <div className="runner__title">
          <b>{DAY(session.dayId).name}</b>
          <span>
            Semana {session.week} · {info.label} · {clock((now - session.startedAt) / 1000)}
          </span>
        </div>
        <button className="icon-btn" onClick={() => setOverview(true)} aria-label="Ver toda la sesión">
          <List size={24} />
        </button>
      </header>
      <div className="runner__bar">
        <span style={{ transform: `scaleX(${p.total ? p.done / p.total : 0})` }} />
      </div>
      <div className="runner__body">
        {finished ? <FinishView session={session} /> : resting ? <RestView session={session} cfg={s0.program} /> : <SetView session={session} cfg={s0.program} />}
      </div>
      <OverviewSheet open={overview} session={session} onClose={() => setOverview(false)} onDiscard={() => void close()} />
    </div>
  );
}

