import type { Activity, Goal, Nutrients, Profile, Sex, Targets } from '../db/types';

export const ACTIVITY: Record<Activity, { label: string; desc: string; factor: number }> = {
  sedentario: { label: 'Sedentaria', desc: 'Trabajo sentado, menos de 5.000 pasos al día', factor: 1.2 },
  ligero: { label: 'Ligera', desc: '5.000–7.500 pasos al día', factor: 1.35 },
  moderado: { label: 'Moderada', desc: '7.500–10.000 pasos al día', factor: 1.5 },
  alto: { label: 'Alta', desc: 'Más de 10.000 pasos o trabajo de pie', factor: 1.65 },
  muy_alto: { label: 'Muy alta', desc: 'Trabajo físico intenso', factor: 1.8 },
};

export const GOAL_LABEL: Record<Goal, string> = { perder: 'Perder grasa', mantener: 'Mantener', ganar: 'Ganar músculo' };

/** Ritmos propuestos en % del peso por semana. */
export const RATE_OPTIONS: Record<Goal, { value: number; label: string; desc: string }[]> = {
  perder: [
    { value: -0.25, label: 'Muy suave', desc: '−0,25 %/sem · máxima retención de músculo' },
    { value: -0.5, label: 'Suave', desc: '−0,5 %/sem · recomendado para recomposición' },
    { value: -0.75, label: 'Moderado', desc: '−0,75 %/sem' },
    { value: -1, label: 'Rápido', desc: '−1 %/sem · solo durante poco tiempo' },
  ],
  mantener: [{ value: 0, label: 'Mantener', desc: 'Sin déficit ni superávit' }],
  ganar: [
    { value: 0.1, label: 'Muy limpio', desc: '+0,1 %/sem · para avanzados' },
    { value: 0.25, label: 'Limpio', desc: '+0,25 %/sem · recomendado (≈ +1 % al mes)' },
    { value: 0.5, label: 'Rápido', desc: '+0,5 %/sem · principiantes, más grasa' },
  ],
};

export const DEFAULT_RATE: Record<Goal, number> = { perder: -0.5, mantener: 0, ganar: 0.25 };

/** Energía de 1 kg de cambio de peso corporal (aprox.). */
export const KCAL_PER_KG = 7700;

export const age = (p: Profile) => new Date().getFullYear() - p.birthYear;

export function bmr(p: Profile, weight: number): { value: number; formula: string } {
  if (p.bodyFatPct && p.bodyFatPct > 3 && p.bodyFatPct < 60) {
    const ffm = weight * (1 - p.bodyFatPct / 100);
    return { value: 370 + 21.6 * ffm, formula: 'Katch-McArdle (usa tu % de grasa)' };
  }
  const base = 10 * weight + 6.25 * p.heightCm - 5 * age(p);
  return { value: base + (p.sex === 'hombre' ? 5 : -161), formula: 'Mifflin-St Jeor' };
}

/** Gasto del entrenamiento de fuerza: ~4 kcal por kg y sesión de 1 h, repartido en la semana. */
export function trainingKcal(p: Profile, weight: number): number {
  return (p.trainingDays * weight * 4) / 7;
}

export function formulaTdee(p: Profile, weight: number): number {
  return bmr(p, weight).value * ACTIVITY[p.activity].factor + trainingKcal(p, weight);
}

/**
 * Peso de referencia para la proteína: con sobrepeso (IMC > 25) se usa el peso equivalente a IMC 25,
 * porque el tejido graso apenas aumenta la necesidad de proteína.
 */
export function referenceWeight(p: Profile, weight: number): { kg: number; adjusted: boolean } {
  const h = p.heightCm / 100;
  const bmi = weight / (h * h);
  if (bmi > 25) return { kg: 25 * h * h, adjusted: true };
  return { kg: weight, adjusted: false };
}

export function calorieFloor(sex: Sex, bmrValue: number): number {
  return Math.max(sex === 'mujer' ? 1200 : 1500, Math.round(bmrValue));
}

export interface MacroPlan {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  waterMl: number;
  explain: { proteinRule: string; fatRule: string };
}

/** Reparto de macros a partir de unas calorías. */
export function macrosFor(p: Profile, weight: number, kcal: number): MacroPlan {
  const losing = p.goal === 'perder';
  let protein: number;
  let proteinRule: string;
  if (p.bodyFatPct && p.bodyFatPct > 3 && p.bodyFatPct < 60) {
    const ffm = weight * (1 - p.bodyFatPct / 100);
    const perKg = losing ? 2.4 : 2.2;
    protein = ffm * perKg;
    proteinRule = `${perKg.toString().replace('.', ',')} g por kg de masa magra (${Math.round(ffm)} kg)`;
  } else {
    const ref = referenceWeight(p, weight);
    const perKg = losing ? 2.2 : 1.8;
    protein = ref.kg * perKg;
    proteinRule = `${perKg.toString().replace('.', ',')} g por kg de ${ref.adjusted ? `peso de referencia (${Math.round(ref.kg)} kg, IMC 25)` : 'peso corporal'}`;
  }
  const ref = referenceWeight(p, weight).kg;
  const fatMin = 0.6 * ref;
  let fat = Math.max((kcal * 0.25) / 9, fatMin);
  let carbs = (kcal - protein * 4 - fat * 9) / 4;
  if (carbs < 50) {
    // Con pocas calorías: se recorta la grasa hasta su mínimo antes que los hidratos.
    fat = Math.max(fatMin, (kcal - protein * 4 - 50 * 4) / 9);
    carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  }
  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
    fiber: Math.max(25, Math.round((kcal / 1000) * 14)),
    waterMl: Math.round((weight * 35) / 250) * 250,
    explain: { proteinRule, fatRule: '25 % de las calorías (mínimo 0,6 g/kg)' },
  };
}

/** kcal/día que corresponden a un ritmo de cambio de peso. */
export const rateKcal = (ratePct: number, weight: number) => ((ratePct / 100) * weight * KCAL_PER_KG) / 7;

export interface Calculation {
  bmr: number;
  bmrFormula: string;
  activityFactor: number;
  training: number;
  tdee: number;
  rateDelta: number;
  floor: number;
  plan: MacroPlan;
}

export function calculate(p: Profile, weight: number, tdeeOverride?: number): Calculation {
  const b = bmr(p, weight);
  const tdee = tdeeOverride ?? formulaTdee(p, weight);
  const delta = rateKcal(p.ratePct, weight);
  const floor = calorieFloor(p.sex, b.value);
  const kcal = Math.max(floor, Math.round((tdee + delta) / 10) * 10);
  return {
    bmr: b.value,
    bmrFormula: b.formula,
    activityFactor: ACTIVITY[p.activity].factor,
    training: trainingKcal(p, weight),
    tdee,
    rateDelta: delta,
    floor,
    plan: macrosFor(p, weight, kcal),
  };
}

export function targetsFrom(c: Calculation, source: Targets['source']): Targets {
  return { ...c.plan, tdee: Math.round(c.tdee), source, setAt: Date.now() };
}

/** Nutrientes de una cantidad en gramos. */
export function scale(n: Nutrients, grams: number): Nutrients {
  const f = grams / 100;
  return {
    kcal: n.kcal * f,
    protein: n.protein * f,
    carbs: n.carbs * f,
    fat: n.fat * f,
    sugar: (n.sugar ?? 0) * f,
    satFat: (n.satFat ?? 0) * f,
    fiber: (n.fiber ?? 0) * f,
    salt: (n.salt ?? 0) * f,
  };
}

export const ZERO: Required<Nutrients> = { kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, satFat: 0, fiber: 0, salt: 0 };

export function sum(list: Nutrients[]): Required<Nutrients> {
  const t = { ...ZERO };
  for (const n of list) {
    t.kcal += n.kcal;
    t.protein += n.protein;
    t.carbs += n.carbs;
    t.fat += n.fat;
    t.sugar += n.sugar ?? 0;
    t.satFat += n.satFat ?? 0;
    t.fiber += n.fiber ?? 0;
    t.salt += n.salt ?? 0;
  }
  return t;
}

/** kcal teóricas a partir de los macros (para detectar errores al leer etiquetas). */
export const kcalFromMacros = (n: Nutrients) => n.protein * 4 + n.carbs * 4 + n.fat * 9 + (n.fiber ?? 0) * 2;
