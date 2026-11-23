import type { GymExerciseLog, GymSession, GymSet, ProgramConfig } from './types';
import { epley, weekInfo, WAVES } from './program';

const SHORT = { acumulacion: 'acumulación', intensificacion: 'intensificación', realizacion: 'AMRAP', descarga: 'descarga', calibracion: 'calibración' } as const;
/** «AMRAP · ola de 10s». */
export function phaseText(week: number) {
  const i = weekInfo(week);
  return i.wave == null ? 'calibración' : `${SHORT[i.phase]} · ola de ${WAVES[i.wave].reps}s`;
}

/* ------------------------------------------------------------------ */
/* «La última vez»: la misma semana de la ola anterior                  */
/* ------------------------------------------------------------------ */

/**
 * Sesión comparable: mismo día y misma fase de la ola anterior (AMRAP con AMRAP, descarga con descarga…).
 * Si esa no se hizo, la de la ola de antes. En la primera ola no hay con qué comparar.
 */
export function comparableSession(sessions: GymSession[], cur: GymSession): GymSession | null {
  for (let w = cur.week - 4; w >= 2; w -= 4) {
    const s = sessions.find((x) => x.status === 'done' && x.id !== cur.id && x.week === w && x.dayId === cur.dayId);
    if (s) return s;
  }
  return null;
}

export interface LastTime {
  week: number;
  date: number;
  label: string;
  weight: number | null;
  reps: number;
  rir: number | null;
}

const ordinal = (e: GymExerciseLog, si: number) => e.sets.slice(0, si).filter((x) => x.kind === e.sets[si].kind).length;

export function lastTimeFor(sessions: GymSession[], cur: GymSession, ei: number, si: number): LastTime | null {
  const prev = comparableSession(sessions, cur);
  if (!prev) return null;
  const e = cur.exercises[ei];
  const pe = prev.exercises.find((x) => x.exId === e.exId) ?? prev.exercises.find((x) => x.name === e.name);
  if (!pe) return null;
  const kind = e.sets[si].kind;
  const same = pe.sets.filter((x) => x.kind === kind);
  const pick = same[ordinal(e, si)] ?? same[same.length - 1];
  if (!pick || !pick.done || pick.reps == null) return null;
  return { week: prev.week, date: prev.startedAt, label: phaseText(prev.week), weight: pick.weight, reps: pick.reps, rir: pick.rir };
}

/* ------------------------------------------------------------------ */
/* Récords: mejor 1RM estimado por ejercicio                            */
/* ------------------------------------------------------------------ */

const COUNTS = new Set(['top', 'plus', 'amrap', 'backoff', 'work', 'acc']);

/** 1RM estimado de una serie (Epley con reps + reserva). null si la serie no sirve para estimarlo. */
export function setE1RM(e: GymExerciseLog, st: GymSet, cfg: ProgramConfig): number | null {
  if (!st.done || st.reps == null || st.reps <= 0 || st.weight == null || !COUNTS.has(st.kind)) return null;
  const load = (e.bodyweight ? cfg.bodyWeight : 0) + st.weight;
  if (load <= 0) return null;
  const rir =
    st.rir ?? (st.kind === 'top' ? 2 : st.kind === 'amrap' || st.kind === 'plus' ? 1 : parseInt(String(st.targetRir ?? '2'), 10) || 2);
  return epley(load, st.reps, rir);
}

export interface PR {
  name: string;
  value: number;
  weight: number;
  reps: number;
  bodyweight: boolean;
  date: number;
  week: number;
}

/** Mejor marca de cada ejercicio (por nombre) en las sesiones dadas. */
export function records(sessions: GymSession[], cfg: ProgramConfig, skipId?: string): Map<string, PR> {
  const best = new Map<string, PR>();
  for (const s of sessions) {
    if (s.id === skipId) continue;
    for (const e of s.exercises)
      for (const st of e.sets) {
        const v = setE1RM(e, st, cfg);
        if (v == null) continue;
        const cur = best.get(e.name);
        if (!cur || v > cur.value)
          best.set(e.name, { name: e.name, value: v, weight: st.weight!, reps: st.reps!, bodyweight: !!e.bodyweight, date: st.doneAt ?? s.startedAt, week: s.week });
      }
  }
  return best;
}
