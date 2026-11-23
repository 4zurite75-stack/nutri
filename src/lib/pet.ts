import { addDays } from './format';

export interface DayInput {
  kcal: number;
  protein: number;
  waterMl: number;
  suppsTaken: number;
  suppsTotal: number;
  weighed: boolean;
}

export interface TargetsLite {
  kcal: number;
  protein: number;
  waterMl: number;
}

export interface DayScore {
  score: number;
  parts: { kcal: number; protein: number; water: number; supps: number; weight: number };
}

/** Puntos máximos de cada objetivo (suman 100). */
export const MAX = { kcal: 40, protein: 25, water: 15, supps: 10, weight: 10 } as const;
export const GOOD_DAY = 70;

export function scoreDay(d: DayInput, t: TargetsLite): DayScore {
  const kcalDiff = t.kcal > 0 ? Math.abs(d.kcal - t.kcal) / t.kcal : 1;
  const kcal = kcalDiff <= 0.1 ? MAX.kcal : kcalDiff <= 0.2 ? 20 : 0;
  const pr = t.protein > 0 ? d.protein / t.protein : 0;
  const protein = pr >= 0.9 ? MAX.protein : pr >= 0.75 ? 12 : 0;
  const wr = t.waterMl > 0 ? d.waterMl / t.waterMl : 1;
  const water = wr >= 1 ? MAX.water : wr >= 0.7 ? 8 : 0;
  const supps = d.suppsTotal === 0 ? MAX.supps : Math.round((MAX.supps * Math.min(d.suppsTaken, d.suppsTotal)) / d.suppsTotal);
  const weight = d.weighed ? MAX.weight : 0;
  return { score: kcal + protein + water + supps + weight, parts: { kcal, protein, water, supps, weight } };
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

/** Salud extra por los días de gym programados: sesión hecha +4, saltada −4. */
export const GYM_BONUS = 4;

/** Recorre los días cerrados (hasta ayer) desde que se adoptó el gato. */
export function computePet(startDate: string, scores: Record<string, number>, today: string, gym: Record<string, 'done' | 'missed'> = {}): PetState {
  let health = 70;
  let goodDays = 0;
  let streak = 0;
  const days: { date: string; score: number }[] = [];
  for (let d = startDate; d < today; d = addDays(d, 1)) {
    const s = scores[d] ?? 0;
    days.push({ date: d, score: s });
    const g = gym[d] === 'done' ? GYM_BONUS : gym[d] === 'missed' ? -GYM_BONUS : 0;
    health = Math.max(0, Math.min(100, health + healthDelta(s) + g));
    if (s >= GOOD_DAY) {
      goodDays++;
      streak++;
    } else streak = 0;
  }
  return { health, mood: moodOf(health), stage: stageOf(goodDays), goodDays, streak, days };
}
