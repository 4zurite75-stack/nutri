import Dexie, { type EntityTable } from 'dexie';
import type { CheckIn, DayLog, Entry, Food, MealTemplate, SettingRow, Supplement, WeightEntry } from './types';
import { seedFoods } from './seedFoods';

export class NutriDB extends Dexie {
  foods!: EntityTable<Food, 'id'>;
  entries!: EntityTable<Entry, 'id'>;
  days!: EntityTable<DayLog, 'date'>;
  weights!: EntityTable<WeightEntry, 'date'>;
  supplements!: EntityTable<Supplement, 'id'>;
  templates!: EntityTable<MealTemplate, 'id'>;
  checkins!: EntityTable<CheckIn, 'id'>;
  settings!: EntityTable<SettingRow, 'key'>;

  constructor() {
    super('nutri');
    this.version(1).stores({
      foods: 'id, name, barcode, lastUsedAt, source, deletedAt',
      entries: 'id, date, foodId, [date+meal]',
      days: 'date',
      weights: 'date',
      supplements: 'id, order',
      templates: 'id, createdAt',
      checkins: 'id, date',
      settings: 'key',
    });
    this.on('populate', (tx) => {
      tx.table('foods').bulkAdd(seedFoods());
    });
  }
}

export const db = new NutriDB();

export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
