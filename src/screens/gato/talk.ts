import { GOOD_DAY, type Mood } from '../../lib/pet';
import type { PetView } from './usePet';
import { fmtK, fmtKg } from '../../lib/format';

export const isNight = (d = new Date()) => d.getHours() >= 23 || d.getHours() < 7;

const MOOD_TEXT: Record<Mood, string> = {
  radiante: '¡Me siento increíble! Sigamos así.',
  sano: 'Estoy bien. Un día más cumpliendo y estaré radiante.',
  cansado: 'Estoy algo cansado… necesito días buenos.',
  enfermo: 'No me encuentro bien. Cumple hoy y me pondré mejor.',
  desnutrido: 'Estoy muy débil… ayúdame cumpliendo los objetivos de hoy.',
};

const PET_TEXT = ['¡Prrrr!', 'Prrr… me encanta.', '¡Miau!', '¡Más mimos!'];

/** Frase del gato: primero lo más útil para hoy, si no, cómo se siente. */
export function catSays(v: PetView, petting: boolean, petCount: number): string {
  if (petting) return PET_TEXT[petCount % PET_TEXT.length];
  const now = new Date();
  if (isNight(now)) return 'Zzz…';
  const { input, result, targets, pendingSupps } = v.today;
  const hour = now.getHours();
  if (result.score >= GOOD_DAY && input.kcal >= targets.kcal * 0.9) return '¡Hoy lo estás bordando! Gracias por cuidarme.';
  if (v.state.mood === 'desnutrido' || v.state.mood === 'enfermo') {
    if (hour < 12) return MOOD_TEXT[v.state.mood];
  }
  if (input.kcal === 0 && hour >= 11) return 'Tengo hambre… ¿apuntamos lo que has comido?';
  if (!input.weighed && hour < 12) return '¿Nos pesamos esta mañana?';
  if (pendingSupps.length && hour >= 9) return `No olvides: ${pendingSupps[0].toLowerCase()}.`;
  if (input.kcal > targets.kcal * 1.1) return `Hoy nos hemos pasado ${fmtK(input.kcal - targets.kcal)} kcal. Mañana lo hacemos mejor.`;
  const proteinLeft = targets.protein - input.protein;
  if (proteinLeft > targets.protein * 0.1 && hour >= 13) return `Me faltan ${fmtK(proteinLeft)} g de proteína para estar fuerte.`;
  if (input.waterMl < targets.waterMl * 0.7 && hour >= 12)
    return `¿Bebemos agua? Llevamos ${fmtKg(Math.round(input.waterMl / 100) / 10)} de ${fmtKg(targets.waterMl / 1000)} L.`;
  if (input.kcal < targets.kcal * 0.9 && hour >= 20) return `Aún nos quedan ${fmtK(targets.kcal - input.kcal)} kcal de hoy.`;
  return MOOD_TEXT[v.state.mood];
}
