import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { DayLog, Entry, Food, Supplement, WeightEntry } from './types';

const collator = new Intl.Collator('es', { sensitivity: 'base' });
export const byName = (a: { name: string }, b: { name: string }) => collator.compare(a.name, b.name);

export function norm(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export function useFoods(): Food[] | undefined {
  return useLiveQuery(async () => (await db.foods.toArray()).filter((f) => !f.deletedAt), []);
}

export function useFood(id: string | undefined): Food | undefined {
  return useLiveQuery(() => (id ? db.foods.get(id) : undefined), [id]);
}

export function useEntries(date: string): Entry[] | undefined {
  return useLiveQuery(() => db.entries.where('date').equals(date).sortBy('createdAt'), [date]);
}

export function useDay(date: string): DayLog {
  return useLiveQuery(async () => (await db.days.get(date)) ?? { date, waterMl: 0, supplements: {} }, [date], {
    date,
    waterMl: 0,
    supplements: {},
  });
}

export function useSupplements(): Supplement[] | undefined {
  return useLiveQuery(() => db.supplements.orderBy('order').toArray(), []);
}

export function useWeights(): WeightEntry[] | undefined {
  return useLiveQuery(() => db.weights.orderBy('date').toArray(), []);
}

/** Búsqueda: coincidencias por palabras, sin tildes; prioriza las más usadas. */
export function searchFoods(foods: Food[], q: string): Food[] {
  const words = norm(q.trim()).split(/\s+/).filter(Boolean);
  if (!words.length) return foods;
  return foods
    .map((f) => {
      const hay = norm(`${f.name} ${f.brand ?? ''}`);
      if (!words.every((w) => hay.includes(w))) return null;
      const name = norm(f.name);
      const starts = name.startsWith(words[0]) ? 2 : 0;
      // Más arriba si la palabra aparece antes y si el nombre es más corto.
      const early = 1 / (1 + Math.max(0, name.indexOf(words[0])) / 4);
      const short = 1 / (1 + name.length / 40);
      return { f, score: starts + early + short + Math.min(3, (f.useCount ?? 0) / 3) + (f.source === 'generico' ? 0 : 0.5) };
    })
    .filter((x): x is { f: Food; score: number } => !!x)
    .sort((a, b) => b.score - a.score || byName(a.f, b.f))
    .map((x) => x.f);
}
