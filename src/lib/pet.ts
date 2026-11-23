import { addDays } from './format';

export interface DayInput {
  kcal: number;
  protein: number;
  waterMl: number;
  suppsTaken: number;
  suppsTotal: number;
  weighed: boolean;
  steps: number;
  stepsGoal: number;
  /** Día de gym del programa: hecho, aún pendiente (hoy) o saltado. null = día de descanso. */
  gym: 'done' | 'pending' | 'missed' | null;
}

export interface TargetsLite {
  kcal: number;
  protein: number;
  waterMl: number;
}

export type PartKey = 'kcal' | 'protein' | 'water' | 'supps' | 'weight' | 'gym' | 'steps';

export interface DayScore {
  score: number;
  /** true si es día de entreno (reparto 60 nutrición + 40 entreno). */
  training: boolean;
  parts: Record<PartKey, number>;
  max: Record<PartKey, number>;
  nutrition: number;
  activity: number;
}

/**
 * Puntos máximos de cada objetivo (suman 100).
 * Días de entreno: nutrición 60 + sesión 30 + pasos 10.
 * Días de descanso: nutrición 70 + pasos 30.
 */
export const MAX_TRAIN: Record<PartKey, number> = { kcal: 24, protein: 15, water: 9, supps: 6, weight: 6, gym: 30, steps: 10 };
export const MAX_REST: Record<PartKey, number> = { kcal: 28, protein: 18, water: 10, supps: 7, weight: 7, gym: 0, steps: 30 };
export const GOOD_DAY = 70;

export function scoreDay(d: DayInput, t: TargetsLite): DayScore {
  const training = d.gym != null;
  const max = training ? MAX_TRAIN : MAX_REST;
  const kcalDiff = t.kcal > 0 ? Math.abs(d.kcal - t.kcal) / t.kcal : 1;
  const pr = t.protein > 0 ? d.protein / t.protein : 0;
  const wr = t.waterMl > 0 ? d.waterMl / t.waterMl : 1;
  const frac: Record<PartKey, number> = {
    kcal: kcalDiff <= 0.1 ? 1 : kcalDiff <= 0.2 ? 0.5 : 0,
    protein: pr >= 0.9 ? 1 : pr >= 0.75 ? 0.5 : 0,
    water: wr >= 1 ? 1 : wr >= 0.7 ? 0.5 : 0,
    supps: d.suppsTotal === 0 ? 1 : Math.min(d.suppsTaken, d.suppsTotal) / d.suppsTotal,
    weight: d.weighed ? 1 : 0,
    gym: d.gym === 'done' ? 1 : 0,
    steps: d.stepsGoal > 0 ? Math.min(1, d.steps / d.stepsGoal) : 0,
  };
  const parts = {} as Record<PartKey, number>;
  for (const k of Object.keys(max) as PartKey[]) parts[k] = Math.round(max[k] * frac[k]);
  const nutrition = parts.kcal + parts.protein + parts.water + parts.supps + parts.weight;
  const activity = parts.gym + parts.steps;
  return { score: nutrition + activity, training, parts, max, nutrition, activity };
}

/** Cambio de salud por un día: 100 → +10, 70 → +3, 55 → 0, 0 → −12. */
export function healthDelta(score: number): number {
  return Math.max(-12, Math.min(10, (score - 55) / 4.5));
}

export type Mood = 'radiante' | 'sano' | 'cansado' | 'enfermo' | 'desnutrido';

export const MOOD_LABEL: Record<Mood, string> = {
  radiante: 'Radiante',
  sano: 'Sano',
  cansado: 'Cansado',
  enfermo: 'Enfermo',
  desnutrido: 'Desnutrido',
};

export function moodOf(health: number): Mood {
  if (health >= 80) return 'radiante';
  if (health >= 60) return 'sano';
  if (health >= 40) return 'cansado';
  if (health >= 20) return 'enfermo';
  return 'desnutrido';
}

export const STAGES = [
  { name: 'Cachorro', from: 0 },
  { name: 'Joven', from: 7 },
  { name: 'Adulto', from: 21 },
  { name: 'Leyenda', from: 60 },
] as const;

export function stageOf(goodDays: number): number {
  let s = 0;
  STAGES.forEach((st, i) => {
    if (goodDays >= st.from) s = i;
  });
  return s;
}

export interface PetState {
  health: number;
  mood: Mood;
  stage: number;
  goodDays: number;
  streak: number;
  /** Días a partir de los que el gato existe (antes no cuenta nada). */
  days: { date: string; score: number }[];
}

/** Recorre los días cerrados (hasta ayer) desde que se adoptó el gato. */
export function computePet(startDate: string, scores: Record<string, number>, today: string): PetState {
  let health = 70;
  let goodDays = 0;
  let streak = 0;
  const days: { date: string; score: number }[] = [];
  for (let d = startDate; d < today; d = addDays(d, 1)) {
    const s = scores[d] ?? 0;
    days.push({ date: d, score: s });
    health = Math.max(0, Math.min(100, health + healthDelta(s)));
    if (s >= GOOD_DAY) {
      goodDays++;
      streak++;
    } else streak = 0;
  }
  return { health, mood: moodOf(health), stage: stageOf(goodDays), goodDays, streak, days };
}
