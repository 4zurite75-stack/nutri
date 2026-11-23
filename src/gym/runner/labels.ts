import type { GymExerciseLog, GymSet, ProgramConfig } from '../types';
import { effectiveTarget, fmtLoad, platesPerSide } from '../program';
import { fmtKg } from '../../lib/format';

/** «Calentamiento 2/4», «Serie top», «Serie 3 de 4»… */
export function setLabel(e: GymExerciseLog, i: number): string {
  const s = e.sets[i];
  const same = e.sets.filter((x) => x.kind === s.kind);
  const n = same.indexOf(s) + 1;
  switch (s.kind) {
    case 'warmup':
      return `Calentamiento ${n}/${same.length}`;
    case 'approach':
      return `Aproximación ${n}/${same.length}`;
    case 'top':
      return 'Serie top';
    case 'backoff':
      return `Serie extra ${n}/${same.length}`;
    case 'work': {
      const total = e.sets.filter((x) => x.kind === 'work' || x.kind === 'plus').length;
      return `Serie ${n} de ${total}`;
    }
    case 'plus': {
      const total = e.sets.filter((x) => x.kind === 'work' || x.kind === 'plus').length;
      return `Serie ${total} de ${total} · «+»`;
    }
    case 'amrap':
      return 'Serie AMRAP';
    case 'deload':
      return `Serie ${n} de ${same.length} · descarga`;
    case 'acc':
      return `Serie ${n} de ${same.length}`;
  }
}

export function repsText(e: GymExerciseLog, s: GymSet): string {
  if (s.kind === 'plus' || s.kind === 'amrap') return `${s.targetReps}+ reps`;
  if (s.targetRepsMax && s.targetRepsMax !== s.targetReps) return `${s.targetReps}–${s.targetRepsMax} reps`;
  if (s.targetReps == null) return `${e.repMin}–${e.repMax} reps`;
  return `${s.targetReps} reps`;
}

export function loadText(e: GymExerciseLog, s: GymSet, cfg: ProgramConfig): string {
  const t = effectiveTarget(e, s, cfg);
  if (t == null) {
    if (s.kind === 'warmup') return e.bodyweight ? 'A peso corporal o asistida' : 'Peso ligero, ve subiendo';
    if (s.kind === 'top') return e.bodyweight ? 'Busca tu carga' : 'Busca tu peso';
    return e.bodyweight ? 'Elige lastre o asistencia' : 'Elige el peso';
  }
  return fmtLoad(t, e.bodyweight);
}

/** Lo que hay que hacer en esta serie, en una frase. */
export function setHowTo(e: GymExerciseLog, s: GymSet, inc?: number): string {
  switch (s.kind) {
    case 'warmup':
      return e.phase === 'calibracion'
        ? 'Calentamiento: sube el peso en cada serie hasta acercarte al de la serie top. Sin llegar al fallo.'
        : 'Calentamiento con la barra y cargas ligeras. Sin cansarte.';
    case 'approach':
      return 'Serie de aproximación: rápida y limpia, muy lejos del fallo.';
    case 'top':
      return `Busca un peso con el que hagas ${e.repMin}–${e.repMax} reps dejando 2 en reserva (RIR 2). Apunta el peso, las reps y el RIR real: de aquí sale tu 1RM.`;
    case 'backoff':
      return e.bodyweight ? 'Misma carga que la serie top. Apunta las reps.' : 'Con un 10 % menos de peso que la serie top. Apunta las reps.';
    case 'work':
      return `Haz exactamente ${s.targetReps} reps con buena técnica.`;
    case 'plus':
      return 'Todas las reps que puedas dejando 1–2 en reserva. Apunta cuántas hiciste.';
    case 'amrap':
      return 'Todas las reps que puedas con buena técnica, dejando 1 en reserva. Este resultado ajusta tu Training Max.';
    case 'deload':
      return 'Semana de descarga: ligero y con técnica perfecta.';
    case 'acc':
      return `Llega a ${e.repMin}–${e.repMax} reps dejando ${s.targetRir} en reserva.${inc ? ` Si llegas a ${e.repMax} en todas las series, la próxima vez subirá ${fmtKg(inc)} kg.` : ''}`;
  }
}

export function platesText(e: GymExerciseLog, kg: number | null, cfg: ProgramConfig): string | null {
  if (!e.barbell || kg == null || kg <= cfg.barWeight) return kg === cfg.barWeight && e.barbell ? 'Solo la barra' : null;
  const { plates, rest } = platesPerSide(kg, cfg.barWeight);
  if (!plates.length) return null;
  return `Por lado: ${plates.map((p) => fmtKg(p)).join(' + ')}${rest > 0 ? ' (aprox.)' : ''}`;
}
