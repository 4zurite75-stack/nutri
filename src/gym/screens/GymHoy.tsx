import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, ChevronRight, Moon, Play, RotateCcw } from 'lucide-react';
import { Page } from '../../ui/Page';
import { useSettings } from '../../state/settings';
import { db } from '../../db/db';
import { useGym, useGymSessions } from '../store';
import { DAY, DAYS, TOTAL_WEEKS, buildSession, scheduledOn, sessionDate, trainingMaxes, LIFTS, weekInfo, weekOn } from '../program';
import type { DayId, GymSession } from '../types';
import { addDays, dayLabel, fmtDateLong, fmtKg, isoDate, isoToTs } from '../../lib/format';
import { ProgramSetup } from './ProgramSetup';
import { StepsCard } from './StepsCard';
import { weightTrend } from '../../lib/adaptive';
import { confirm } from '../../ui/uiStore';
import { push } from '../../nav/nav';
import { SessionDetail } from './GymHistory';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const doneFor = (sessions: GymSession[], week: number, day: DayId) =>
  sessions.find((s) => s.status === 'done' && s.week === week && s.dayId === day);

async function startSession(week: number, day: DayId) {
  const st = useGym.getState();
  if (st.session) {
    if (st.session.week === week && st.session.dayId === day) return st.setExpanded(true);
    const ok = await confirm({ title: 'Tienes otra sesión a medias', message: 'Termínala o descártala antes de empezar otra.', confirmText: 'Ver sesión' });
    if (ok) st.setExpanded(true);
    return;
  }
  await st.start(week, day);
}

export function GymHoy() {
  const s = useSettings();
  const sessions = useGymSessions() ?? [];
  const active = useGym((x) => x.session);
  const weights = useLiveQuery(() => db.weights.toArray(), [], []);
  const cfg = s.program;
  const today = isoDate();

  const todays = cfg ? scheduledOn(cfg, today) : null;
  const week = cfg ? Math.max(1, Math.min(TOTAL_WEEKS, weekOn(cfg, today))) : 1;
  const info = weekInfo(week);
  const preview = useMemo(() => (cfg && todays ? buildSession(todays.week, todays.day, sessions, cfg, 'preview') : null), [cfg, todays?.week, todays?.day, sessions]);

  if (s.loading) return <Page title="Gym" large />;
  if (!cfg) {
    const t = weightTrend(weights);
    return (
      <Page title="Gym" large>
        <ProgramSetup suggestedWeight={t.length ? t[t.length - 1].trend : s.profile?.startWeightKg} />
      </Page>
    );
  }

  const started = today >= cfg.startDate;
  const finished = weekOn(cfg, today) > TOTAL_WEEKS;
  const todayDone = todays ? doneFor(sessions, todays.week, todays.day) : undefined;
  const isActiveToday = active && todays && active.week === todays.week && active.dayId === todays.day;
  // Sesiones de esta semana que ya pasaron y no se hicieron.
  const missed = DAYS.filter((d) => {
    const date = sessionDate(cfg, week, d.id);
    return date < today && !doneFor(sessions, week, d.id) && !(active && active.week === week && active.dayId === d.id);
  });
  const next = (() => {
    for (let i = 1; i <= 14; i++) {
      const d = addDays(today, i);
      const sc = scheduledOn(cfg, d);
      if (sc) return { date: d, ...sc };
    }
    return null;
  })();
  const calibrated = LIFTS.filter((l) => trainingMaxes(l.id, sessions, cfg)[0] != null).length;
  const monday = addDays(cfg.startDate, (week - 1) * 7);

  return (
    <Page title="Gym" large>
      {!started ? (
        <section className="ghero ghero--rest">
          <span className="ghero__kicker">El programa empieza el {fmtDateLong(isoToTs(cfg.startDate)).toLowerCase()}</span>
          <h2 className="ghero__title">Aún no ha empezado</h2>
        </section>
      ) : finished ? (
        <section className="ghero">
          <span className="ghero__kicker">17 semanas completadas</span>
          <h2 className="ghero__title">¡Ciclo terminado!</h2>
          <p className="ghero__text">Revisa tus Training Max finales en Programa y decidid el siguiente paso.</p>
        </section>
      ) : todays ? (
        <section className={`ghero ${todayDone ? 'ghero--done' : ''}`}>
          <div className="ghero__top">
            <span className="ghero__kicker">
              Semana {todays.week} de {TOTAL_WEEKS} · {weekInfo(todays.week).label}
            </span>
          </div>
          <h2 className="ghero__title">{DAY(todays.day).name}</h2>
          <p className="ghero__date">{fmtDateLong(isoToTs(today))}</p>
          {preview && !todayDone && (
            <ol className="ghero__list">
              {preview.exercises.map((e) => (
                <li key={e.exId}>
                  <b>{e.name}</b>
                  <span>{e.instructions.split('. ')[0]}</span>
                </li>
              ))}
            </ol>
          )}
          {todayDone ? (
            <button className="btn btn--block ghero__btn ghero__btn--ghost" onClick={() => push(() => <SessionDetail id={todayDone.id} />)}>
              <CheckCircle2 size={20} /> Sesión completada · ver resumen
            </button>
          ) : (
            <button className="btn btn--block btn--lg ghero__btn" onClick={() => void startSession(todays.week, todays.day)}>
              <Play size={20} fill="currentColor" /> {isActiveToday ? 'Continuar sesión' : 'Empezar sesión'}
            </button>
          )}
        </section>
      ) : (
        <section className="ghero ghero--rest">
          <span className="ghero__kicker">
            Semana {week} · {info.label}
          </span>
          <h2 className="ghero__title">
            <Moon size={26} /> Hoy descansas
          </h2>
          {next && (
            <p className="ghero__text">
              Próxima sesión: <b>{DAY(next.day).name}</b> · {dayLabel(next.date).toLowerCase()}
            </p>
          )}
        </section>
      )}

      {active && !isActiveToday && (
        <button className="gpending gpending--active" onClick={() => useGym.getState().setExpanded(true)}>
          <span className="gpending__dot" />
          <span>
            <b>Sesión a medias:</b> {DAY(active.dayId).name} (semana {active.week})
          </span>
          <ChevronRight size={18} />
        </button>
      )}
      {started && !finished &&
        missed.map((d) => (
          <button key={d.id} className="gpending" onClick={() => void startSession(week, d.id)}>
            <RotateCcw size={18} />
            <span>
              <b>Pendiente:</b> {d.name} ({dayLabel(sessionDate(cfg, week, d.id)).toLowerCase()}). Tócalo para hacerla ahora.
            </span>
            <ChevronRight size={18} />
          </button>
        ))}

      {started && !finished && (
        <>
          <div className="section-head">
            <h2>Semana {week}</h2>
            <span className="muted">{info.label}</span>
          </div>
          <div className="gweek">
            {WEEKDAYS.map((l, i) => {
              const date = addDays(monday, i);
              const day = DAYS.find((d) => d.offset === i);
              const done = day && doneFor(sessions, week, day.id);
              const state = !day ? 'rest' : done ? 'done' : date < today ? 'missed' : date === today ? 'today' : 'next';
              return (
                <div key={i} className={`gweek__day is-${state}`}>
                  <span className="gweek__l">{l}</span>
                  <span className="gweek__dot">{day ? (done ? '✓' : day.short.charAt(0)) : ''}</span>
                  <span className="gweek__n">{new Date(isoToTs(date)).getDate()}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="section-head">
        <h2>Training Max</h2>
        <span className="muted">{calibrated}/6 calibrados</span>
      </div>
      <div className="tmchips">
        {LIFTS.map((l) => {
          const tms = trainingMaxes(l.id, sessions, cfg);
          const w = info.wave ?? 0;
          const tm = tms[w];
          return (
            <div key={l.id} className={`tmchip ${tm == null ? 'is-pending' : ''}`}>
              <span>{l.short}</span>
              <b>{tm == null ? 'Calibrar' : `${fmtKg(tm)} kg`}</b>
            </div>
          );
        })}
      </div>
      {calibrated < 6 && (
        <p className="hint group-hint">El Training Max (90 % de tu 1RM) sale de la serie top de calibración de la semana 1.</p>
      )}

      <div className="hoy__cards">
        <StepsCard />
      </div>
    </Page>
  );
}
