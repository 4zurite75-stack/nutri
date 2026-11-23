import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Page } from '../../ui/Page';
import { Chip } from '../../ui/controls';
import { useSettings } from '../../state/settings';
import { useGymSessions } from '../store';
import { DAYS, LIFTS, TOTAL_WEEKS, epley, oneRM, sessionDate, trainingMaxes, weekOn } from '../program';
import type { LiftId } from '../types';
import { LineChart } from '../../charts/LineChart';
import { BarChart } from '../../charts/BarChart';
import { addDays, dayLabel, fmtK, fmtKg, isoDate, isoToTs } from '../../lib/format';
import { db } from '../../db/db';
import { doneFor } from './GymHoy';

export function GymProgress() {
  const s = useSettings();
  const cfg = s.program;
  const sessions = useGymSessions() ?? [];
  const days = useLiveQuery(() => db.days.toArray(), [], []);
  const [lift, setLift] = useState<LiftId>('banca');
  const today = isoDate();

  const points = useMemo(() => {
    if (!cfg) return [];
    const out: { x: number; y: number; d: string }[] = [];
    for (const ses of sessions.filter((x) => x.status === 'done').sort((a, b) => a.startedAt - b.startedAt)) {
      for (const e of ses.exercises) {
        if (e.lift !== lift) continue;
        let best = 0;
        let desc = '';
        for (const st of e.sets) {
          if (!st.done || st.reps == null || st.weight == null) continue;
          if (!['top', 'plus', 'amrap', 'backoff', 'work'].includes(st.kind)) continue;
          const rir = st.kind === 'top' ? st.rir ?? 2 : st.kind === 'amrap' || st.kind === 'plus' ? 1 : 2;
          const load = (e.bodyweight ? cfg.bodyWeight : 0) + st.weight;
          const v = epley(load, st.reps, rir);
          if (v > best) {
            best = v;
            desc = `${fmtKg(st.weight)} × ${st.reps}`;
          }
        }
        if (best) out.push({ x: ses.startedAt, y: best, d: desc });
      }
    }
    return out;
  }, [sessions, lift, cfg]);

  if (!cfg) return <Page title="Progreso" large><p className="muted" style={{ padding: 24 }}>Activa el programa en la pestaña Hoy.</p></Page>;

  const rm = oneRM(lift, sessions, cfg);
  const tms = trainingMaxes(lift, sessions, cfg);
  const scheduledSoFar: { week: number; day: (typeof DAYS)[number]['id'] }[] = [];
  for (let w = 1; w <= Math.min(TOTAL_WEEKS, weekOn(cfg, today)); w++)
    for (const d of DAYS) if (sessionDate(cfg, w, d.id) <= today) scheduledSoFar.push({ week: w, day: d.id });
  const done = scheduledSoFar.filter((x) => doneFor(sessions, x.week, x.day)).length;
  const last = points[points.length - 1];
  const first = points[0];
  const steps = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i - 13);
    const v = days.find((x) => x.date === d)?.steps ?? 0;
    return { label: String(new Date(isoToTs(d)).getDate()), value: v, tip: `${dayLabel(d)}: ${fmtK(v)} pasos`, highlight: d === today };
  });
  const withSteps = steps.filter((x) => x.value > 0);
  const avgSteps = withSteps.length ? withSteps.reduce((a, x) => a + x.value, 0) / withSteps.length : 0;

  return (
    <Page title="Progreso" large>
      <div className="kpis">
        <div className="kpi">
          <span className="kpi__label">Sesiones</span>
          <span className="kpi__value">
            {done}/{scheduledSoFar.length}
          </span>
          <span className="delta delta--same">hechas</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Semana</span>
          <span className="kpi__value">{Math.max(1, Math.min(TOTAL_WEEKS, weekOn(cfg, today)))}</span>
          <span className="delta delta--same">de {TOTAL_WEEKS}</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Pasos/día</span>
          <span className="kpi__value">{avgSteps ? fmtK(avgSteps) : '—'}</span>
          <span className="delta delta--same">media 14 d</span>
        </div>
      </div>

      <div className="section-head">
        <h2>Fuerza</h2>
      </div>
      <div className="section">
        <div className="chips-scroll">
          {LIFTS.map((l) => (
            <Chip key={l.id} active={lift === l.id} onClick={() => setLift(l.id)}>
              {l.short}
            </Chip>
          ))}
        </div>
      </div>
      <div className="chart-card" style={{ marginTop: 10 }}>
        <div className="chart-card__head">
          <div>
            <div className="chart-card__value">
              {last ? fmtKg(Math.round(last.y)) : rm ? fmtKg(Math.round(rm.value)) : '—'} <small>kg</small>
            </div>
            <div className="chart-card__sub">1RM estimado {last ? 'en la última sesión' : rm ? '(calibración)' : ''}</div>
          </div>
          {first && last && points.length > 1 && (
            <span className={`trend trend--${last.y > first.y ? 'up' : last.y < first.y ? 'down' : 'same'}`}>
              {last.y >= first.y ? '+' : '−'}
              {fmtKg(Math.abs(Math.round((last.y - first.y) * 10) / 10))} kg
            </span>
          )}
        </div>
        {points.length > 0 ? (
          <LineChart series={[{ name: '1RM estimado', points }]} unit="kg" fmtY={(v) => fmtKg(Math.round(v))} detail={(i) => points[i]?.d} />
        ) : (
          <p className="muted" style={{ padding: 20, textAlign: 'center' }}>
            Aparecerá cuando hagas la calibración.
          </p>
        )}
        <div className="tmcard__waves" style={{ marginTop: 10 }}>
          {['10s', '8s', '5s', '3s', 'Sig.'].map((lab, i) => (
            <span key={lab} className="tmw">
              <small>TM {lab}</small>
              <b>{tms[i] == null ? '—' : fmtKg(tms[i]!)}</b>
            </span>
          ))}
        </div>
      </div>
      <p className="hint group-hint">1RM estimado con Epley usando reps + reserva en tus series top, «+» y AMRAP.</p>

      <div className="section-head">
        <h2>Pasos · 14 días</h2>
      </div>
      <div className="chart-card">
        <BarChart bars={steps} fmtV={fmtK} refValue={s.stepsGoal} refLabel={`Objetivo ${fmtK(s.stepsGoal)}`} />
      </div>
    </Page>
  );
}
