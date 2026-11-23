export type LiftId = 'banca' | 'dominadas' | 'militar' | 'remoT' | 'sentadilla' | 'rumano';
export type DayId = 'd1' | 'd2' | 'd3';
export type Muscle =
  | 'pecho'
  | 'dorsal'
  | 'espaldaAlta'
  | 'deltAnt'
  | 'deltLat'
  | 'deltPost'
  | 'biceps'
  | 'triceps'
  | 'cuadriceps'
  | 'isquios'
  | 'gluteo'
  | 'erectores'
  | 'gemelos'
  | 'abdomen';

export interface ExerciseDef {
  id: string; // único por día (p. ej. 'd1-laterales')
  name: string;
  kind: 'main' | 'acc';
  lift?: LiftId;
  sets: number;
  repMin: number;
  repMax: number;
  rir: string; // '1–2' | '0–1'
  restSec: number;
  /** Accesorios: lo que sube el peso al llegar al tope del rango. Principales: kg de TM por rep extra en el AMRAP. */
  inc: number;
  /** El peso registrado es lastre sobre el peso corporal (0 = sin lastre, negativo = asistida). */
  bodyweight?: boolean;
  /** Se carga en barra olímpica (para la calculadora de discos). */
  barbell?: boolean;
  note?: string;
  muscles: Partial<Record<Muscle, number>>; // 1 = directa, 0,5 = indirecta
}

export interface DayDef {
  id: DayId;
  name: string;
  short: string;
  /** Días desde el lunes de la semana (0 = lunes, 2 = miércoles, 4 = viernes). */
  offset: number;
  exercises: ExerciseDef[];
}

export type SetKind = 'warmup' | 'approach' | 'top' | 'backoff' | 'work' | 'plus' | 'amrap' | 'deload' | 'acc';

export interface GymSet {
  id: string;
  kind: SetKind;
  /** Carga objetivo (en dominadas: lastre). null = la eliges tú. */
  targetWeight: number | null;
  targetReps: number | null;
  /** Para rangos (accesorios, serie top): tope del rango. */
  targetRepsMax?: number;
  targetRir?: string;
  /** Pide apuntar peso, reps y/o RIR. */
  ask: { weight: boolean; reps: boolean; rir: boolean };
  /** La carga sale de otra serie ya hecha (backoff = 90 % de la top). */
  derive?: 'top90' | 'top100';
  weight: number | null;
  reps: number | null;
  rir: number | null;
  done: boolean;
  /** Serie saltada (no se hizo). */
  skipped?: boolean;
  doneAt?: number;
  restSec: number;
}

export interface GymExerciseLog {
  exId: string;
  name: string;
  kind: 'main' | 'acc';
  lift?: LiftId;
  bodyweight?: boolean;
  barbell?: boolean;
  /** Texto de «Qué hacer» para todo el ejercicio. */
  instructions: string;
  /** Fase del ejercicio en esta sesión (para mostrar y para el motor). */
  phase: 'calibracion' | 'acumulacion' | 'intensificacion' | 'realizacion' | 'descarga' | 'accesorio';
  repMin: number;
  repMax: number;
  sets: GymSet[];
  /** Notas personales de este ejercicio en esta sesión (técnica, ajustes de máquina…). */
  note?: string;
}

export interface GymSession {
  id: string;
  week: number;
  dayId: DayId;
  /** Fecha programada (YYYY-MM-DD). */
  date: string;
  status: 'active' | 'done';
  startedAt: number;
  endedAt?: number;
  exercises: GymExerciseLog[];
  /** Posición actual de la sesión guiada. */
  cursor: { ex: number; set: number };
  rest?: { endsAt: number; duration: number } | null;
  notes?: string;
}

export interface ProgramConfig {
  startDate: string; // lunes de la semana 1
  bodyWeight: number; // para las dominadas
  rounding: number; // 2,5 kg
  tmPct: number; // 0,9
  barWeight: number; // 20 kg
  /** 1RM manual por ejercicio principal (opcional; sustituye a la calibración). */
  manual1RM: Partial<Record<LiftId, number>>;
}
