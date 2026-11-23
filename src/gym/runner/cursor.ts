import type { GymSession } from '../types';

/** Siguiente serie pendiente a partir de una posición (en orden de la sesión). */
export function nextPending(s: GymSession, from: { ex: number; set: number }): { ex: number; set: number } | null {
  for (let e = from.ex; e < s.exercises.length; e++) {
    const sets = s.exercises[e].sets;
    for (let i = e === from.ex ? from.set : 0; i < sets.length; i++) if (!sets[i].done && !sets[i].skipped) return { ex: e, set: i };
  }
  // Si quedó algo atrás sin hacer (saltado por error), se ofrece al final.
  for (let e = 0; e < s.exercises.length; e++) {
    const sets = s.exercises[e].sets;
    for (let i = 0; i < sets.length; i++) if (!sets[i].done && !sets[i].skipped) return { ex: e, set: i };
  }
  return null;
}

export function progress(s: GymSession) {
  const all = s.exercises.flatMap((e) => e.sets);
  return { done: all.filter((x) => x.done || x.skipped).length, total: all.length };
}
