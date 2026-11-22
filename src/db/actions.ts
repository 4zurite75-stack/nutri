import { db } from './db';
import type { DayLog, Entry, Food, MealTemplate } from './types';
import { uid } from '../lib/id';

export async function addEntry(food: Food, grams: number, meal: string, date: string, portion?: { name: string; qty: number }) {
  const now = Date.now();
  const e: Entry = {
    id: uid(),
    date,
    meal,
    foodId: food.id,
    grams,
    portionName: portion?.name,
    portionQty: portion?.qty,
    name: food.name,
    brand: food.brand,
    unit: food.unit,
    per100: food.per100,
    createdAt: now,
  };
  await db.transaction('rw', db.entries, db.foods, async () => {
    await db.entries.add(e);
    await db.foods.update(food.id, { lastUsedAt: now, useCount: (food.useCount ?? 0) + 1, lastGrams: grams });
  });
  return e;
}

export async function updateEntry(id: string, patch: Partial<Entry>) {
  await db.entries.update(id, patch);
}

export async function deleteEntry(id: string) {
  await db.entries.delete(id);
}

/** Copia las entradas de una comida (o de todo el día si meal es null) a otra fecha/comida. */
export async function copyEntries(fromDate: string, fromMeal: string | null, toDate: string, toMeal?: string): Promise<number> {
  const src = await db.entries.where('date').equals(fromDate).toArray();
  const list = src.filter((e) => fromMeal === null || e.meal === fromMeal);
  const now = Date.now();
  await db.entries.bulkAdd(
    list.map((e, i) => ({ ...e, id: uid(), date: toDate, meal: toMeal ?? e.meal, createdAt: now + i })),
  );
  return list.length;
}

export async function saveTemplate(name: string, entries: Entry[], scope: MealTemplate['scope']) {
  const t: MealTemplate = {
    id: uid(),
    name,
    scope,
    items: entries.map((e) => ({ foodId: e.foodId, grams: e.grams, meal: e.meal, portionName: e.portionName, portionQty: e.portionQty })),
    createdAt: Date.now(),
  };
  await db.templates.put(t);
  return t;
}

/** Añade una plantilla usando los valores actuales de cada alimento. */
export async function applyTemplate(t: MealTemplate, date: string, meal?: string): Promise<number> {
  const foods = await db.foods.bulkGet(t.items.map((i) => i.foodId));
  const now = Date.now();
  const rows: Entry[] = [];
  t.items.forEach((it, i) => {
    const f = foods[i];
    if (!f) return;
    rows.push({
      id: uid(),
      date,
      meal: t.scope === 'comida' && meal ? meal : it.meal,
      foodId: f.id,
      grams: it.grams,
      portionName: it.portionName,
      portionQty: it.portionQty,
      name: f.name,
      brand: f.brand,
      unit: f.unit,
      per100: f.per100,
      createdAt: now + i,
    });
  });
  await db.entries.bulkAdd(rows);
  return rows.length;
}

export async function updateDay(date: string, fn: (d: DayLog) => void) {
  await db.transaction('rw', db.days, async () => {
    const d = (await db.days.get(date)) ?? { date, waterMl: 0, supplements: {} };
    fn(d);
    await db.days.put(d);
  });
}

export async function setWeight(date: string, kg: number | null) {
  if (kg == null) await db.weights.delete(date);
  else await db.weights.put({ date, kg, createdAt: Date.now() });
}

/** kcal por día de todo el diario (para el análisis adaptativo y las gráficas). */
export async function intakeByDate(): Promise<Map<string, { kcal: number; protein: number; carbs: number; fat: number }>> {
  const all = await db.entries.toArray();
  const m = new Map<string, { kcal: number; protein: number; carbs: number; fat: number }>();
  for (const e of all) {
    const f = e.grams / 100;
    const cur = m.get(e.date) ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    cur.kcal += e.per100.kcal * f;
    cur.protein += e.per100.protein * f;
    cur.carbs += e.per100.carbs * f;
    cur.fat += e.per100.fat * f;
    m.set(e.date, cur);
  }
  return m;
}
