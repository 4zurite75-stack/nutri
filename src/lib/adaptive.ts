import type { Profile, Targets, WeightEntry } from '../db/types';
import { calorieFloor, bmr, formulaTdee, KCAL_PER_KG, macrosFor, rateKcal } from './nutrition';
import { isoDate } from './format';

const DAY = 86400000;
const toTs = (d: string) => new Date(d + 'T12:00:00').getTime();

export interface TrendPoint {
  date: string;
  t: number;
  raw?: number;
  trend: number;
}

/**
 * Tendencia del peso: media móvil exponencial diaria (α = 0,1). Suaviza el agua y la comida del día
 * y deja ver el cambio real. Los días sin pesarse mantienen la tendencia.
 */
export function weightTrend(weights: WeightEntry[], until = isoDate()): TrendPoint[] {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return [];
  const byDate = new Map(sorted.map((w) => [w.date, w.kg]));
  const out: TrendPoint[] = [];
  let trend = sorted[0].kg;
  for (let t = toTs(sorted[0].date); t <= toTs(until); t += DAY) {
    const date = isoDate(new Date(t));
    const raw = byDate.get(date);
    if (raw != null) trend = trend + 0.1 * (raw - trend);
    out.push({ date, t, raw, trend });
  }
  return out;
}

export type Verdict = 'datos' | 'en_objetivo' | 'lento' | 'rapido' | 'contrario';

export interface Analysis {
  verdict: Verdict;
  title: string;
  message: string;
  /** Días analizados y días con comida registrada. */
  days: number;
  loggedDays: number;
  avgIntake?: number;
  actualRatePct?: number;
  dataTdee?: number;
  /** Mantenimiento combinado (datos + fórmula según la confianza). */
  tdee: number;
  confidence: number;
  recommendedKcal: number;
  change: number;
  currentWeight: number;
}

/**
 * Compara el ritmo real (tendencia de peso) con el objetivo usando la comida registrada:
 * mantenimiento real ≈ ingesta media − cambio de peso × 7700 kcal/kg / días.
 */
export function analyze(
  profile: Profile,
  targets: Targets,
  weights: WeightEntry[],
  intakeByDate: Map<string, number>,
  windowDays = 21,
): Analysis {
  const trend = weightTrend(weights);
  const currentWeight = trend.length ? trend[trend.length - 1].trend : profile.startWeightKg;
  const formula = formulaTdee(profile, currentWeight);
  const base = {
    tdee: Math.round(formula),
    confidence: 0,
    recommendedKcal: targets.kcal,
    change: 0,
    currentWeight,
    days: 0,
    loggedDays: 0,
  };
  if (trend.length < 8) {
    return {
      ...base,
      verdict: 'datos',
      title: 'Reuniendo datos',
      message: 'Pésate a diario (o casi) y registra lo que comes. En 2 semanas la app calculará tu mantenimiento real.',
    };
  }
  const win = trend.slice(-Math.min(windowDays, trend.length));
  const days = win.length - 1;
  const start = win[0];
  const end = win[win.length - 1];
  const delta = end.trend - start.trend;
  // Un día cuenta como registrado si tiene al menos el 40 % del objetivo (evita días a medio apuntar).
  const logged = win.slice(1).filter((p) => (intakeByDate.get(p.date) ?? 0) >= targets.kcal * 0.4);
  const weighIns = win.filter((p) => p.raw != null).length;
  const coverage = logged.length / Math.max(1, days);
  const actualRatePct = ((delta / days) * 7 * 100) / end.trend;

  if (logged.length < 7 || weighIns < 5) {
    return {
      ...base,
      days,
      loggedDays: logged.length,
      actualRatePct,
      verdict: 'datos',
      title: 'Faltan registros',
      message: `En los últimos ${days} días hay ${logged.length} días con comida registrada y ${weighIns} pesajes. Hacen falta al menos 7 y 5 para un cálculo fiable.`,
    };
  }

  const avgIntake = logged.reduce((a, p) => a + (intakeByDate.get(p.date) ?? 0), 0) / logged.length;
  const dataTdee = avgIntake - (delta * KCAL_PER_KG) / days;
  const confidence = Math.min(1, (days - 6) / 15) * Math.min(1, Math.max(0, (coverage - 0.5) / 0.35));
  const tdee = confidence * dataTdee + (1 - confidence) * formula;

  const floor = calorieFloor(profile.sex, bmr(profile, currentWeight).value);
  let rec = Math.max(floor, tdee + rateKcal(profile.ratePct, currentWeight));
  // Cambios graduales: como mucho ±300 kcal por revisión.
  rec = Math.round(Math.min(targets.kcal + 300, Math.max(targets.kcal - 300, rec)) / 10) * 10;
  let change = rec - targets.kcal;
  if (Math.abs(change) < 75) change = 0;
  const recommendedKcal = targets.kcal + change;

  const target = profile.ratePct;
  const fmt = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2).replace('.', ',')} %`;
  const diff = actualRatePct - target;
  let verdict: Verdict;
  let title: string;
  let message: string;

  if (profile.goal === 'perder') {
    if (actualRatePct < -1.1) {
      verdict = 'rapido';
      title = 'Bajas demasiado rápido';
      message = `Pierdes ${fmt(actualRatePct)} de tu peso por semana. Por encima del 1 % aumenta la pérdida de músculo y el cansancio.`;
    } else if (actualRatePct > 0.05) {
      verdict = 'contrario';
      title = 'No estás bajando';
      message = `Tu tendencia sube (${fmt(actualRatePct)}/sem). Tu mantenimiento real es menor de lo calculado.`;
    } else if (Math.abs(diff) <= 0.15) {
      verdict = 'en_objetivo';
      title = 'Vas al ritmo previsto';
      message = `Bajas ${fmt(actualRatePct)}/sem frente a un objetivo de ${fmt(target)}/sem.`;
    } else if (diff > 0) {
      verdict = 'lento';
      title = 'Bajas más despacio de lo previsto';
      message = `Bajas ${fmt(actualRatePct)}/sem; el objetivo es ${fmt(target)}/sem.`;
    } else {
      verdict = 'rapido';
      title = 'Bajas algo más rápido de lo previsto';
      message = `Bajas ${fmt(actualRatePct)}/sem; el objetivo es ${fmt(target)}/sem.`;
    }
  } else if (profile.goal === 'ganar') {
    if (actualRatePct < -0.05) {
      verdict = 'contrario';
      title = 'Estás perdiendo peso';
      message = `Tu tendencia baja (${fmt(actualRatePct)}/sem): sin superávit es difícil ganar músculo.`;
    } else if (Math.abs(diff) <= 0.1) {
      verdict = 'en_objetivo';
      title = 'Vas al ritmo previsto';
      message = `Subes ${fmt(actualRatePct)}/sem frente a un objetivo de ${fmt(target)}/sem.`;
    } else if (diff < 0) {
      verdict = 'lento';
      title = 'Subes más despacio de lo previsto';
      message = `Subes ${fmt(actualRatePct)}/sem; el objetivo es ${fmt(target)}/sem.`;
    } else {
      verdict = 'rapido';
      title = 'Subes demasiado rápido';
      message = `Subes ${fmt(actualRatePct)}/sem; el objetivo es ${fmt(target)}/sem. Ganarías más grasa de la necesaria.`;
    }
  } else {
    verdict = Math.abs(actualRatePct) <= 0.15 ? 'en_objetivo' : actualRatePct > 0 ? 'rapido' : 'lento';
    title = verdict === 'en_objetivo' ? 'Peso estable' : actualRatePct > 0 ? 'Estás subiendo' : 'Estás bajando';
    message = `Tu tendencia cambia ${fmt(actualRatePct)}/sem.`;
  }

  // Antes de tocar las calorías hay que cumplir el plan: si la ingesta media se aleja del objetivo, se dice.
  const adherence = avgIntake / targets.kcal - 1;
  if (verdict !== 'en_objetivo' && Math.abs(adherence) > 0.07) {
    const k = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    message += ` Ojo: comes de media ${k(avgIntake)} kcal frente a un objetivo de ${k(targets.kcal)} (${adherence > 0 ? '+' : '−'}${Math.round(Math.abs(adherence) * 100)} %). Lo primero es acercarte al objetivo.`;
  }

  return {
    verdict,
    title,
    message,
    days,
    loggedDays: logged.length,
    avgIntake,
    actualRatePct,
    dataTdee,
    tdee: Math.round(tdee),
    confidence,
    recommendedKcal,
    change,
    currentWeight,
  };
}

export function targetsForKcal(profile: Profile, weight: number, kcal: number, tdee: number, source: Targets['source']): Targets {
  return { ...macrosFor(profile, weight, kcal), tdee: Math.round(tdee), source, setAt: Date.now() };
}
