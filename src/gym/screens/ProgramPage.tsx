import { useEffect, useState } from 'react';
import { ChevronRight, Settings2 } from 'lucide-react';
import { Page } from '../../ui/Page';
import { setSetting, useSettings } from '../../state/settings';
import { useGymSessions } from '../store';
import { DAYS, LIFTS, TOTAL_WEEKS, WAVES, buildSession, oneRM, sessionDate, trainingMaxes, weekInfo, weekOn, weeklySets, type Phase } from '../program';
import { fmtDateShort, fmtKg, fmt1, isoDate, isoToTs } from '../../lib/format';
import { push, pop } from '../../nav/nav';
import { doneFor } from './GymHoy';
import { ProgramFields } from './ProgramSetup';
import { NumField, parseNum } from '../../ui/fields';
import type { LiftId, ProgramConfig } from '../types';
import { confirm, toast } from '../../ui/uiStore';
import { db } from '../../db/db';

const PHASE_SHORT: Record<Phase, string> = { calibracion: 'Cal', acumulacion: 'Acu', intensificacion: 'Int', realizacion: 'AMRAP', descarga: 'Desc' };
const MUSCLE_LABEL: Record<string, string> = {
  pecho: 'Pecho',
  dorsal: 'Dorsal ancho',
  espaldaAlta: 'Espalda alta',
  deltAnt: 'Deltoides anterior',
  deltLat: 'Deltoides lateral',
  deltPost: 'Deltoides posterior',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  cuadriceps: 'Cuádriceps',
  isquios: 'Isquios',
  gluteo: 'Glúteo',
  erectores: 'Erectores / lumbar',
  gemelos: 'Gemelos',
  abdomen: 'Abdomen',
};

export function ProgramPage() {
  const s = useSettings();
  const sessions = useGymSessions() ?? [];
  const cfg = s.program;
  if (!cfg) return <Page title="Programa" large><p className="muted" style={{ padding: 24 }}>Activa el programa en la pestaña Hoy.</p></Page>;
  const today = isoDate();
  const current = Math.max(1, Math.min(TOTAL_WEEKS, weekOn(cfg, today)));
  const info = weekInfo(current);
  const vol = weeklySets(current);
  const volMax = Math.max(10, ...Object.values(vol));

  return (
    <Page
      title="Programa"
      large
      right={
        <button className="icon-btn" onClick={() => push(() => <ProgramSettings />)} aria-label="Ajustes del programa">
          <Settings2 size={22} />
        </button>
      }
    >
      <section className="ptl">
        <div className="ptl__head">
          <b>Semana {current} de {TOTAL_WEEKS}</b>
          <span className="muted">{info.label}</span>
        </div>
        <div className="ptl__bar">
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
            const w = i + 1;
            const wi = weekInfo(w);
            return (
              <span key={w} className={`ptl__seg ph-${wi.phase} ${w === current ? 'is-current' : ''} ${w < current ? 'is-past' : ''}`} title={`Semana ${w}`}>
                {w}
              </span>
            );
          })}
        </div>
        <div className="ptl__legend">
          {(['acumulacion', 'intensificacion', 'realizacion', 'descarga'] as Phase[]).map((p) => (
            <span key={p}>
              <i className={`ph-${p}`} /> {PHASE_SHORT[p]}
            </span>
          ))}
        </div>
      </section>

      <div className="section-head">
        <h2>Training Max</h2>
        <span className="muted">kg por ola</span>
      </div>
      <div className="tmcards">
        {LIFTS.map((l) => {
          const rm = oneRM(l.id, sessions, cfg);
          const tms = trainingMaxes(l.id, sessions, cfg);
          return (
            <div key={l.id} className="tmcard">
              <div className="tmcard__head">
                <b>{l.name}</b>
                <span className="muted">{rm ? `1RM ${fmtKg(rm.value)} kg${rm.source === 'manual' ? ' (manual)' : ''}` : 'Pendiente de calibrar'}</span>
              </div>
              <div className="tmcard__waves">
                {['10s', '8s', '5s', '3s', 'Sig.'].map((lab, i) => (
                  <span key={lab} className={`tmw ${info.wave === i ? 'is-current' : ''}`}>
                    <small>{lab}</small>
                    <b>{tms[i] == null ? '—' : fmtKg(tms[i]!)}</b>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="hint group-hint">
        TM = 90 % del 1RM. Tras cada AMRAP sube 1 kg (torso) o 2 kg (pierna) por cada rep por encima del mínimo de la ola (máx. 10).
      </p>

      <div className="section-head">
        <h2>Semanas</h2>
      </div>
      <div className="group">
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
          const w = i + 1;
          const wi = weekInfo(w);
          return (
            <button key={w} className={`group__row group__row--link wkrow ${w === current ? 'is-current' : ''}`} onClick={() => push(() => <WeekDetail week={w} />)}>
              <span className={`wkrow__n ph-${wi.phase}`}>{w}</span>
              <span className="wkrow__text">
                <b>{wi.label}</b>
                <small className="muted">
                  {fmtDateShort(isoToTs(sessionDate(cfg, w, 'd1')))} – {fmtDateShort(isoToTs(sessionDate(cfg, w, 'd3')))}
                </small>
              </span>
              <span className="wkrow__dots">
                {DAYS.map((d) => {
                  const done = doneFor(sessions, w, d.id);
                  const past = sessionDate(cfg, w, d.id) < today;
                  return <i key={d.id} className={done ? 'is-done' : past ? 'is-missed' : ''} />;
                })}
              </span>
              <ChevronRight size={16} className="muted" />
            </button>
          );
        })}
      </div>

      <div className="section-head">
        <h2>Series por músculo</h2>
        <span className="muted">semana {current}</span>
      </div>
      <div className="chart-card">
        <div className="mbars">
          {Object.entries(vol)
            .sort((a, b) => b[1] - a[1])
            .map(([m, v]) => (
              <div key={m} className="mbar">
                <span className="mbar__label">{MUSCLE_LABEL[m]}</span>
                <span className="mbar__track">
                  <span className="mbar__fill" style={{ width: `${(v / volMax) * 100}%` }} />
                </span>
                <span className="mbar__val">{fmt1(v)}</span>
              </div>
            ))}
        </div>
        <p className="hint" style={{ padding: '0 4px' }}>
          Serie directa = 1, indirecta = 0,5 (como en tu Excel).
        </p>
      </div>
    </Page>
  );
}

export function WeekDetail({ week }: { week: number }) {
  const s = useSettings();
  const sessions = useGymSessions() ?? [];
  const cfg = s.program;
  const wi = weekInfo(week);
  if (!cfg) return <Page title={`Semana ${week}`} back="Programa" />;
  return (
    <Page title={`Semana ${week}`} back="Programa">
      <div className="wd-head">
        <h2>Semana {week}</h2>
        <p className="muted">{wi.label}</p>
      </div>
      {DAYS.map((d) => {
        const done = doneFor(sessions, week, d.id);
        const plan = done ?? buildSession(week, d.id, sessions, cfg, 'preview');
        return (
          <div key={d.id} className="wd-ex">
            <div className="wd-ex__head">
              <span className="wd-ex__name">
                {d.name} · {fmtDateShort(isoToTs(sessionDate(cfg, week, d.id)))}
              </span>
              {done && <span className="pr-badge">Hecha</span>}
            </div>
            <div className="wd-sets">
              {plan.exercises.map((e) => (
                <div key={e.exId} className="wk-ex">
                  <b>{e.name}</b>
                  <span className="muted">{e.instructions}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <p className="hint group-hint">Las cargas de semanas futuras se recalculan con tus resultados (calibración, AMRAP y accesorios).</p>
    </Page>
  );
}

export function ProgramSettings() {
  const s = useSettings();
  const [cfg, setCfg] = useState<ProgramConfig | null>(s.program);
  useEffect(() => {
    if (!cfg && s.program) setCfg(s.program);
  }, [s.program, cfg]);
  if (!cfg) return <Page title="Ajustes del programa" back />;
  const setManual = (l: LiftId, v: string) => setCfg({ ...cfg, manual1RM: { ...cfg.manual1RM, [l]: parseNum(v) ?? undefined } });
  return (
    <Page
      title="Ajustes del programa"
      back="Programa"
      right={
        <button
          className="link-btn is-bold"
          onClick={async () => {
            await setSetting('program', cfg);
            toast('Programa actualizado', { tone: 'success' });
            pop();
          }}
        >
          Guardar
        </button>
      }
    >
      <ProgramFields cfg={cfg} onChange={setCfg} />
      <div className="group-title">1RM manual (opcional)</div>
      <div className="form">
        <div className="numfield-grid">
          {LIFTS.map((l) => (
            <NumField key={l.id} label={l.short} value={cfg.manual1RM[l.id] ? fmtKg(cfg.manual1RM[l.id]!) : ''} placeholder="Auto" unit="kg" onChange={(v) => setManual(l.id, v)} />
          ))}
        </div>
        <p className="hint" style={{ marginTop: -8 }}>
          Si lo dejas vacío se usa el de la calibración. En dominadas, el 1RM es peso corporal + lastre.
        </p>
      </div>
      <button
        className="btn btn--danger-plain"
        onClick={async () => {
          if (!(await confirm({ title: '¿Reiniciar el programa?', message: 'Se borrarán todas las sesiones del gym y los Training Max. La nutrición no se toca.', confirmText: 'Reiniciar', destructive: true }))) return;
          await db.gymSessions.clear();
          await setSetting('program', null);
          toast('Programa reiniciado');
          pop();
        }}
      >
        Reiniciar programa
      </button>
      <p className="hint group-hint">Olas: {WAVES.map((w) => `${w.reps}s`).join(' · ')}. Redondeo de discos: {fmtKg(cfg.rounding)} kg.</p>
    </Page>
  );
}
