import type { DayDef, DayId, ExerciseDef, GymExerciseLog, GymSession, GymSet, LiftId, ProgramConfig, SetKind } from './types';

/* ------------------------------------------------------------------ */
/* Rutina (hoja «Rutina» del Excel)                                     */
/* ------------------------------------------------------------------ */

const ex = (d: Omit<ExerciseDef, 'id'> & { id: string }): ExerciseDef => d;

export const DAYS: DayDef[] = [
  {
    id: 'd1',
    name: 'Día 1 – Torso',
    short: 'Torso',
    offset: 0,
    exercises: [
      ex({ id: 'd1-banca', name: 'Press banca con barra', kind: 'main', lift: 'banca', sets: 4, repMin: 5, repMax: 8, rir: '1–2', restSec: 180, inc: 1, barbell: true, muscles: { pecho: 1, deltAnt: 0.5, triceps: 0.5 } }),
      ex({ id: 'd1-dominadas', name: 'Dominadas', kind: 'main', lift: 'dominadas', sets: 4, repMin: 5, repMax: 8, rir: '1–2', restSec: 180, inc: 1, bodyweight: true, muscles: { dorsal: 1, espaldaAlta: 0.5, biceps: 0.5 } }),
      ex({ id: 'd1-militar', name: 'Press militar sentado', kind: 'main', lift: 'militar', sets: 3, repMin: 6, repMax: 10, rir: '1–2', restSec: 150, inc: 1, barbell: true, muscles: { deltAnt: 1, deltLat: 0.5, triceps: 0.5 } }),
      ex({ id: 'd1-remoT', name: 'Remo en T', kind: 'main', lift: 'remoT', sets: 3, repMin: 6, repMax: 10, rir: '1–2', restSec: 120, inc: 1, muscles: { espaldaAlta: 1, dorsal: 0.5, deltPost: 0.5, biceps: 0.5 } }),
      ex({ id: 'd1-laterales', name: 'Elevaciones laterales', kind: 'acc', sets: 3, repMin: 10, repMax: 15, rir: '0–1', restSec: 90, inc: 1, muscles: { deltLat: 1 } }),
      ex({ id: 'd1-triceps', name: 'Extensión de tríceps', kind: 'acc', sets: 3, repMin: 8, repMax: 12, rir: '0–1', restSec: 90, inc: 2.5, muscles: { triceps: 1 } }),
    ],
  },
  {
    id: 'd2',
    name: 'Día 2 – Pierna',
    short: 'Pierna',
    offset: 2,
    exercises: [
      ex({ id: 'd2-sentadilla', name: 'Sentadilla trasera libre', kind: 'main', lift: 'sentadilla', sets: 4, repMin: 5, repMax: 8, rir: '1–2', restSec: 180, inc: 2, barbell: true, muscles: { cuadriceps: 1, gluteo: 0.5, erectores: 0.5 } }),
      ex({ id: 'd2-rumano', name: 'Peso muerto rumano', kind: 'main', lift: 'rumano', sets: 3, repMin: 6, repMax: 10, rir: '1–2', restSec: 150, inc: 2, barbell: true, muscles: { isquios: 1, gluteo: 0.5, erectores: 0.5 } }),
      ex({ id: 'd2-prensa', name: 'Prensa', kind: 'acc', sets: 3, repMin: 8, repMax: 12, rir: '1–2', restSec: 120, inc: 5, muscles: { cuadriceps: 1, gluteo: 0.5 } }),
      ex({ id: 'd2-femoral', name: 'Curl femoral sentado', kind: 'acc', sets: 3, repMin: 8, repMax: 12, rir: '0–1', restSec: 90, inc: 2.5, muscles: { isquios: 1 } }),
      ex({ id: 'd2-gemelos', name: 'Gemelos', kind: 'acc', sets: 4, repMin: 8, repMax: 12, rir: '0–1', restSec: 90, inc: 5, muscles: { gemelos: 1 } }),
      ex({ id: 'd2-abdomen', name: 'Abdomen (rueda o crunch en polea)', kind: 'acc', sets: 3, repMin: 8, repMax: 15, rir: '0–1', restSec: 90, inc: 2.5, muscles: { abdomen: 1 } }),
    ],
  },
  {
    id: 'd3',
    name: 'Día 3 – Full Body',
    short: 'Full Body',
    offset: 4,
    exercises: [
      ex({ id: 'd3-inclinado', name: 'Press inclinado en máquina', kind: 'acc', sets: 3, repMin: 6, repMax: 10, rir: '1–2', restSec: 150, inc: 2.5, muscles: { pecho: 1, deltAnt: 0.5, triceps: 0.5 } }),
      ex({ id: 'd3-neutras', name: 'Dominadas con agarre neutro', kind: 'acc', sets: 3, repMin: 6, repMax: 10, rir: '1–2', restSec: 150, inc: 2.5, bodyweight: true, muscles: { dorsal: 1, espaldaAlta: 0.5, biceps: 0.5 } }),
      ex({ id: 'd3-hack', name: 'Sentadilla hack o en máquina', kind: 'acc', sets: 3, repMin: 8, repMax: 10, rir: '1–2', restSec: 120, inc: 5, note: 'Sustituye a la sentadilla búlgara', muscles: { cuadriceps: 1, gluteo: 0.5 } }),
      ex({ id: 'd3-plano', name: 'Press plano en máquina', kind: 'acc', sets: 3, repMin: 6, repMax: 10, rir: '1–2', restSec: 120, inc: 2.5, note: 'Sustituye a los fondos', muscles: { pecho: 1, deltAnt: 0.5, triceps: 0.5 } }),
      ex({ id: 'd3-femoral', name: 'Curl femoral', kind: 'acc', sets: 3, repMin: 8, repMax: 12, rir: '0–1', restSec: 90, inc: 2.5, muscles: { isquios: 1 } }),
      ex({ id: 'd3-laterales', name: 'Elevaciones laterales', kind: 'acc', sets: 3, repMin: 10, repMax: 15, rir: '0–1', restSec: 90, inc: 1, muscles: { deltLat: 1 } }),
      ex({ id: 'd3-biceps', name: 'Curl de bíceps', kind: 'acc', sets: 3, repMin: 8, repMax: 12, rir: '0–1', restSec: 90, inc: 1, muscles: { biceps: 1 } }),
    ],
  },
];

export const DAY = (id: DayId) => DAYS.find((d) => d.id === id)!;
export const LIFTS: { id: LiftId; name: string; short: string }[] = [
  { id: 'banca', name: 'Press banca', short: 'Banca' },
  { id: 'dominadas', name: 'Dominadas', short: 'Dominadas' },
  { id: 'militar', name: 'Press militar', short: 'Militar' },
  { id: 'remoT', name: 'Remo en T', short: 'Remo T' },
  { id: 'sentadilla', name: 'Sentadilla', short: 'Sentadilla' },
  { id: 'rumano', name: 'Peso muerto rumano', short: 'P. rumano' },
];
export const liftDef = (lift: LiftId) => DAYS.flatMap((d) => d.exercises).find((e) => e.lift === lift)!;

/* ------------------------------------------------------------------ */
/* Periodización por olas (hoja «Sesiones»)                             */
/* ------------------------------------------------------------------ */

export const TOTAL_WEEKS = 17;
export type Phase = 'calibracion' | 'acumulacion' | 'intensificacion' | 'realizacion' | 'descarga';
export const PHASE_LABEL: Record<Phase, string> = {
  calibracion: 'Calibración',
  acumulacion: 'Acumulación',
  intensificacion: 'Intensificación',
  realizacion: 'Realización (AMRAP)',
  descarga: 'Descarga',
};

type Step = [reps: number, pct: number];
interface Wave {
  reps: number;
  acc: { n: number; pct: number };
  int: { approach: Step[]; n: number; pct: number };
  real: { ramp: Step[]; pct: number };
}

export const WAVES: Wave[] = [
  { reps: 10, acc: { n: 4, pct: 0.6 }, int: { approach: [[5, 0.55], [5, 0.625]], n: 2, pct: 0.675 }, real: { ramp: [[5, 0.5], [3, 0.6], [1, 0.7]], pct: 0.75 } },
  { reps: 8, acc: { n: 4, pct: 0.65 }, int: { approach: [[3, 0.6], [3, 0.675]], n: 2, pct: 0.725 }, real: { ramp: [[5, 0.5], [3, 0.6], [2, 0.7], [1, 0.75]], pct: 0.8 } },
  { reps: 5, acc: { n: 5, pct: 0.7 }, int: { approach: [[2, 0.65], [2, 0.725]], n: 3, pct: 0.775 }, real: { ramp: [[5, 0.5], [3, 0.6], [2, 0.7], [1, 0.75], [1, 0.8]], pct: 0.85 } },
  { reps: 3, acc: { n: 6, pct: 0.75 }, int: { approach: [[1, 0.7], [1, 0.775]], n: 4, pct: 0.825 }, real: { ramp: [[5, 0.5], [3, 0.6], [2, 0.7], [1, 0.75], [1, 0.8], [1, 0.85]], pct: 0.9 } },
];
const DELOAD: Step[] = [
  [5, 0.4],
  [5, 0.5],
  [5, 0.6],
];

export interface WeekInfo {
  week: number;
  wave: number | null; // 0..3
  phase: Phase;
  label: string; // "Ola 10s · Acumulación"
}

export function weekInfo(week: number): WeekInfo {
  if (week <= 1) return { week: 1, wave: null, phase: 'calibracion', label: 'Calibración' };
  const w = week - 2;
  const wave = Math.min(3, Math.floor(w / 4));
  const phase = (['acumulacion', 'intensificacion', 'realizacion', 'descarga'] as Phase[])[w % 4];
  return { week, wave, phase, label: `Ola de ${WAVES[wave].reps}s · ${PHASE_LABEL[phase]}` };
}

/** Semana de realización (AMRAP) de cada ola: 4, 8, 12, 16. */
export const realizationWeek = (wave: number) => 2 + wave * 4 + 2;

/* ------------------------------------------------------------------ */
/* Calendario fijo (lunes, miércoles y viernes)                         */
/* ------------------------------------------------------------------ */

const toTs = (iso: string) => new Date(iso + 'T12:00:00').getTime();
export function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const sessionDate = (cfg: ProgramConfig, week: number, day: DayId) => addDaysIso(cfg.startDate, (week - 1) * 7 + DAY(day).offset);

/** Qué sesión toca una fecha (null si es día de descanso o fuera del programa). */
export function scheduledOn(cfg: ProgramConfig, date: string): { week: number; day: DayId } | null {
  const diff = Math.round((toTs(date) - toTs(cfg.startDate)) / 86400000);
  if (diff < 0) return null;
  const week = Math.floor(diff / 7) + 1;
  if (week > TOTAL_WEEKS) return null;
  const day = DAYS.find((d) => d.offset === diff % 7);
  return day ? { week, day: day.id } : null;
}

/** Semana del programa en una fecha (1..17), aunque sea día de descanso. */
export function weekOn(cfg: ProgramConfig, date: string): number {
  const diff = Math.floor((toTs(date) - toTs(cfg.startDate)) / 86400000);
  return Math.floor(diff / 7) + 1;
}

/** Lunes de la semana de una fecha. */
export function mondayOf(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return addDaysIso(iso, -((d.getDay() + 6) % 7));
}

/* ------------------------------------------------------------------ */
/* Cálculos (hoja «Progresión»)                                          */
/* ------------------------------------------------------------------ */

export const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** 1RM estimado con Epley usando reps + reps en reserva. */
export const epley = (load: number, reps: number, rir: number) => Math.round(load * (1 + (reps + rir) / 30) * 10) / 10;

const doneSessions = (sessions: GymSession[]) => sessions.filter((s) => s.status === 'done' || s.status === 'active');

function findSet(sessions: GymSession[], lift: LiftId, kind: SetKind, week?: number): { s: GymSet; session: GymSession } | null {
  const list = doneSessions(sessions)
    .filter((s) => week == null || s.week === week)
    .sort((a, b) => a.week - b.week || a.startedAt - b.startedAt);
  for (const session of list) {
    for (const e of session.exercises) {
      if (e.lift !== lift) continue;
      const s = e.sets.find((x) => x.kind === kind && x.done && x.reps != null && x.weight != null);
      if (s) return { s, session };
    }
  }
  return null;
}

export interface OneRM {
  value: number;
  source: 'manual' | 'calibracion';
  /** Serie con la que se calculó. */
  from?: { weight: number; reps: number; rir: number; week: number };
}

export function oneRM(lift: LiftId, sessions: GymSession[], cfg: ProgramConfig): OneRM | null {
  const manual = cfg.manual1RM[lift];
  if (manual && manual > 0) return { value: manual, source: 'manual' };
  const top = findSet(sessions, lift, 'top');
  if (!top) return null;
  const { weight, reps, rir } = top.s;
  const load = (liftDef(lift).bodyweight ? cfg.bodyWeight : 0) + (weight ?? 0);
  return { value: epley(load, reps ?? 0, rir ?? 2), source: 'calibracion', from: { weight: weight ?? 0, reps: reps ?? 0, rir: rir ?? 2, week: top.session.week } };
}

export const amrapReps = (lift: LiftId, sessions: GymSession[], wave: number): number | null =>
  findSet(sessions, lift, 'amrap', realizationWeek(wave))?.s.reps ?? null;

/** Training Max de cada ola: 90 % del 1RM y, tras cada AMRAP, + reps extra × incremento (máx. 10). */
export function trainingMaxes(lift: LiftId, sessions: GymSession[], cfg: ProgramConfig): (number | null)[] {
  const rm = oneRM(lift, sessions, cfg);
  if (!rm) return [null, null, null, null, null];
  const inc = liftDef(lift).inc;
  const out: number[] = [roundTo(rm.value * cfg.tmPct, cfg.rounding)];
  for (let w = 0; w < 4; w++) {
    const reps = amrapReps(lift, sessions, w);
    const extra = reps == null ? 0 : Math.max(0, Math.min(reps - WAVES[w].reps, 10));
    out.push(Math.round((out[w] + extra * inc) * 10) / 10);
  }
  return out; // [ola 10s, ola 8s, ola 5s, ola 3s, siguiente ciclo]
}

/** Carga a poner en la barra (o lastre en dominadas) para un % del TM. */
export function loadFor(lift: LiftId, tm: number, pct: number, cfg: ProgramConfig): number {
  if (liftDef(lift).bodyweight) return roundTo(pct * tm - cfg.bodyWeight, cfg.rounding);
  return roundTo(pct * tm, cfg.rounding);
}

/** Doble progresión de accesorios: mismo peso, o + incremento si en la última sesión llegaste al tope del rango en todas las series. */
export function accessoryTarget(def: ExerciseDef, week: number, sessions: GymSession[]): { weight: number; reason: 'sube' | 'mantiene'; lastReps: number[] } | null {
  const prev = doneSessions(sessions)
    .filter((s) => s.week < week && weekInfo(s.week).phase !== 'descarga')
    .sort((a, b) => b.week - a.week || b.startedAt - a.startedAt);
  for (const s of prev) {
    const e = s.exercises.find((x) => x.exId === def.id);
    const sets = e?.sets.filter((x) => x.kind === 'acc' && x.done && x.weight != null && x.reps != null) ?? [];
    if (!sets.length) continue;
    const weight = Math.max(...sets.map((x) => x.weight!));
    const allTop = sets.length >= def.sets && sets.every((x) => (x.reps ?? 0) >= def.repMax);
    return { weight: allTop ? Math.round((weight + def.inc) * 100) / 100 : weight, reason: allTop ? 'sube' : 'mantiene', lastReps: sets.map((x) => x.reps!) };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Construcción de la sesión                                            */
/* ------------------------------------------------------------------ */

let seq = 0;
const sid = () => `s${Date.now().toString(36)}${(seq++).toString(36)}`;

function mk(kind: SetKind, p: Partial<GymSet> & { restSec: number }): GymSet {
  const ask = p.ask ?? {
    weight: kind === 'top' || kind === 'acc' || kind === 'backoff',
    reps: kind !== 'warmup' && kind !== 'approach' && kind !== 'deload',
    rir: kind === 'top',
  };
  return {
    id: sid(),
    kind,
    targetWeight: p.targetWeight ?? null,
    targetReps: p.targetReps ?? null,
    targetRepsMax: p.targetRepsMax,
    targetRir: p.targetRir,
    ask,
    derive: p.derive,
    weight: null,
    reps: null,
    rir: null,
    done: false,
    restSec: p.restSec,
  };
}

export function fmtLoad(kg: number | null, bodyweight?: boolean): string {
  if (kg == null) return '';
  const n = (x: number) => (Math.round(x * 100) / 100).toString().replace('.', ',');
  if (!bodyweight) return `${n(kg)} kg`;
  if (kg > 0) return `+${n(kg)} kg de lastre`;
  if (kg === 0) return 'peso corporal';
  return `asistida ${n(-kg)} kg`;
}

/** «a 60 kg», «con +5 kg de lastre», «a peso corporal», «asistidas con 10 kg». */
export function loadPhrase(kg: number, bodyweight?: boolean): string {
  const n = (x: number) => (Math.round(x * 100) / 100).toString().replace('.', ',');
  if (!bodyweight) return `a ${n(kg)} kg`;
  if (kg > 0) return `con +${n(kg)} kg de lastre`;
  if (kg === 0) return 'a peso corporal';
  return `asistidas con ${n(-kg)} kg`;
}

/** Calentamiento con la barra antes de las series de trabajo (solo ejercicios con barra). */
function warmups(def: ExerciseDef, first: number, cfg: ProgramConfig): GymSet[] {
  if (!def.barbell || first < cfg.barWeight + 15) return [];
  const out: GymSet[] = [];
  const steps: [number, number][] = [
    [0, 10],
    [0.5, 5],
    [0.75, 3],
  ];
  let last = -1;
  for (const [pct, reps] of steps) {
    const w = pct === 0 ? cfg.barWeight : Math.max(cfg.barWeight, roundTo(first * pct, cfg.rounding));
    if (w <= last || w >= first) continue;
    out.push(mk('warmup', { targetWeight: w, targetReps: reps, restSec: 60 }));
    last = w;
  }
  return out;
}

function mainExercise(def: ExerciseDef, week: number, sessions: GymSession[], cfg: ProgramConfig): GymExerciseLog {
  const lift = def.lift!;
  const info = weekInfo(week);
  const tms = trainingMaxes(lift, sessions, cfg);
  const base = { exId: def.id, name: def.name, kind: 'main' as const, lift, bodyweight: def.bodyweight, barbell: def.barbell, repMin: def.repMin, repMax: def.repMax };
  const L = (x: number) => loadPhrase(x, def.bodyweight);

  // Semana 1, o sin 1RM todavía: calibración.
  if (info.phase === 'calibracion' || tms[0] == null) {
    const bw = def.bodyweight;
    return {
      ...base,
      phase: 'calibracion',
      instructions: bw
        ? `Calienta. Haz 1 serie top de ${def.repMin}–${def.repMax} reps dejando 2 en reserva (RIR 2): si sin lastre haces más de ${def.repMax}, añade lastre; si no llegas a ${def.repMin}, usa asistencia. Después 2 series más con la misma carga.`
        : `Calienta subiendo en 3–4 saltos. Haz 1 serie top de ${def.repMin}–${def.repMax} reps dejando 2 en reserva (RIR 2). Después 2 series más con un 10 % menos de peso.`,
      sets: [
        ...(bw
          ? [mk('warmup', { targetWeight: null, targetReps: 5, restSec: 90 })]
          : [mk('warmup', { targetReps: 10, restSec: 60 }), mk('warmup', { targetReps: 5, restSec: 75 }), mk('warmup', { targetReps: 3, restSec: 90 })]),
        mk('top', { targetReps: def.repMin, targetRepsMax: def.repMax, targetRir: '2', restSec: def.restSec }),
        mk('backoff', { derive: bw ? 'top100' : 'top90', targetReps: def.repMin, targetRepsMax: def.repMax, restSec: def.restSec }),
        mk('backoff', { derive: bw ? 'top100' : 'top90', targetReps: def.repMin, targetRepsMax: def.repMax, restSec: def.restSec }),
      ],
    };
  }

  const wave = info.wave!;
  const W = WAVES[wave];
  const tm = tms[wave]!;
  const at = (pct: number) => loadFor(lift, tm, pct, cfg);
  const plusText = 'En la serie «+» haz todas las reps que puedas dejando 1–2 en reserva.';

  if (info.phase === 'acumulacion') {
    const w = at(W.acc.pct);
    const sets = [
      ...warmups(def, w, cfg),
      ...Array.from({ length: W.acc.n }, () => mk('work', { targetWeight: w, targetReps: W.reps, restSec: def.restSec })),
      mk('plus', { targetWeight: w, targetReps: W.reps, restSec: def.restSec }),
    ];
    return { ...base, phase: 'acumulacion', instructions: `${W.acc.n}×${W.reps} + 1×${W.reps}+ ${L(w)}. ${plusText}`, sets };
  }
  if (info.phase === 'intensificacion') {
    const w = at(W.int.pct);
    const approach = W.int.approach.map(([r, p]) => mk('approach', { targetWeight: at(p), targetReps: r, restSec: 90 }));
    const sets = [
      ...warmups(def, at(W.int.approach[0][1]), cfg),
      ...approach,
      ...Array.from({ length: W.int.n }, () => mk('work', { targetWeight: w, targetReps: W.reps, restSec: def.restSec })),
      mk('plus', { targetWeight: w, targetReps: W.reps, restSec: def.restSec }),
    ];
    const txt = W.int.approach.map(([r, p]) => `1×${r} ${L(at(p))}`).join(' · ');
    return { ...base, phase: 'intensificacion', instructions: `${txt} · ${W.int.n}×${W.reps} + 1×${W.reps}+ ${L(w)}. ${plusText}`, sets };
  }
  if (info.phase === 'realizacion') {
    const ramp = W.real.ramp.map(([r, p]) => mk('approach', { targetWeight: at(p), targetReps: r, restSec: p >= 0.75 ? 120 : 90 }));
    const w = at(W.real.pct);
    const sets = [...warmups(def, at(W.real.ramp[0][1]), cfg), ...ramp, mk('amrap', { targetWeight: w, targetReps: W.reps, targetRir: '1', restSec: def.restSec })];
    const txt = W.real.ramp.map(([r, p]) => `1×${r} ${L(at(p))}`).join(' · ');
    return {
      ...base,
      phase: 'realizacion',
      instructions: `${txt} · 1×${W.reps}+ ${L(w)}. Las primeras series son de aproximación. En la última haz todas las reps que puedas con buena técnica (deja 1 en reserva).`,
      sets,
    };
  }
  // Descarga
  const sets = DELOAD.map(([r, p]) => mk('deload', { targetWeight: at(p), targetReps: r, restSec: 90, ask: { weight: false, reps: false, rir: false } }));
  return { ...base, phase: 'descarga', instructions: `${DELOAD.map(([r, p]) => `1×${r} ${L(at(p))}`).join(' · ')}. Semana de descarga.`, sets };
}

function accExercise(def: ExerciseDef, week: number, sessions: GymSession[]): GymExerciseLog {
  const info = weekInfo(week);
  const deload = info.phase === 'descarga';
  const target = accessoryTarget(def, week, sessions);
  const n = deload ? Math.ceil(def.sets / 2) : def.sets;
  const rir = deload ? '3' : def.rir;
  const range = `${def.repMin}–${def.repMax}`;
  const load = target ? fmtLoad(target.weight, def.bodyweight) : '';
  const instructions = !target
    ? `Elige un peso con el que hagas ${n} series de ${range} reps dejando ${rir} en reserva.`
    : `${deload ? 'Descarga: ' : ''}${n} × ${range} reps · RIR ${rir} · ${load}${!deload && target.reason === 'sube' ? ` (sube ${fmtLoad(def.inc).replace(' kg', '')} kg: la última vez llegaste al tope en todas las series)` : ''}`;
  return {
    exId: def.id,
    name: def.name,
    kind: 'acc',
    bodyweight: def.bodyweight,
    barbell: def.barbell,
    phase: deload ? 'descarga' : 'accesorio',
    repMin: def.repMin,
    repMax: def.repMax,
    instructions,
    sets: Array.from({ length: n }, () =>
      mk('acc', { targetWeight: target?.weight ?? null, targetReps: def.repMin, targetRepsMax: def.repMax, targetRir: rir, restSec: def.restSec }),
    ),
  };
}

export function buildSession(week: number, day: DayId, sessions: GymSession[], cfg: ProgramConfig, id: string): GymSession {
  const d = DAY(day);
  return {
    id,
    week,
    dayId: day,
    date: sessionDate(cfg, week, day),
    status: 'active',
    startedAt: Date.now(),
    exercises: d.exercises.map((def) => (def.kind === 'main' ? mainExercise(def, week, sessions, cfg) : accExercise(def, week, sessions))),
    cursor: { ex: 0, set: 0 },
    rest: null,
  };
}

/** Carga objetivo efectiva de una serie (resuelve las que dependen de la serie top). */
export function effectiveTarget(e: GymExerciseLog, s: GymSet, cfg: ProgramConfig): number | null {
  if (s.derive) {
    const top = e.sets.find((x) => x.kind === 'top');
    if (top?.weight == null) return null;
    return s.derive === 'top90' ? roundTo(top.weight * 0.9, cfg.rounding) : top.weight;
  }
  return s.targetWeight;
}

/** Series semanales por músculo (directa = 1, indirecta = 0,5) de una semana del programa. */
export function weeklySets(week: number): Record<string, number> {
  const info = weekInfo(week);
  const out: Record<string, number> = {};
  for (const d of DAYS)
    for (const e of d.exercises) {
      let n = e.sets;
      if (info.phase === 'descarga') n = e.kind === 'main' ? 3 : Math.ceil(e.sets / 2);
      for (const [m, f] of Object.entries(e.muscles)) out[m] = (out[m] ?? 0) + n * (f ?? 0);
    }
  return out;
}

/** Discos por lado para cargar una barra. */
export function platesPerSide(total: number, bar: number, plates = [25, 20, 15, 10, 5, 2.5, 1.25]): { plates: number[]; rest: number } {
  let side = (total - bar) / 2;
  const out: number[] = [];
  if (side <= 0) return { plates: [], rest: 0 };
  for (const p of plates) {
    while (side >= p - 1e-9) {
      out.push(p);
      side -= p;
    }
  }
  return { plates: out, rest: Math.round(side * 100) / 100 };
}
