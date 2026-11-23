import { strFromU8, strToU8, unzip, zip, type Unzipped } from 'fflate';
import { db } from '../db/db';
import type { CheckIn, DayLog, Entry, Food, MealTemplate, SettingRow, Supplement, WeightEntry } from '../db/types';
import { isoDate } from './format';
import type { GymSession } from '../gym/types';

const FORMAT = 'nutri-backup';
const FOODS_FORMAT = 'nutri-alimentos';
const VERSION = 1;

type FoodJSON = Omit<Food, 'thumb'> & { thumbFile?: string };

interface BackupJSON {
  format: typeof FORMAT;
  version: number;
  exportedAt: number;
  foods: FoodJSON[];
  entries: Entry[];
  days: DayLog[];
  weights: WeightEntry[];
  supplements: Supplement[];
  templates: MealTemplate[];
  checkins: CheckIn[];
  settings: SettingRow[];
  gymSessions?: GymSession[];
}

type Files = Record<string, Uint8Array | [Uint8Array, { level: 0 }]>;
const zipAsync = (files: Files) => new Promise<Uint8Array>((res, rej) => zip(files, { level: 6 }, (e, d) => (e ? rej(e) : res(d))));
const unzipAsync = (data: Uint8Array) => new Promise<Unzipped>((res, rej) => unzip(data, (e, d) => (e ? rej(e) : res(d))));

/** Ajustes que no viajan en las copias: la clave de IA es personal. */
const PRIVATE_SETTINGS = new Set(['apiKey', 'lastBackupAt']);

async function packFoods(foods: Food[], files: Files): Promise<FoodJSON[]> {
  const out: FoodJSON[] = [];
  for (const f of foods) {
    const { thumb, ...rest } = f;
    let thumbFile: string | undefined;
    if (thumb) {
      thumbFile = `miniaturas/${f.id}.jpg`;
      files[thumbFile] = [new Uint8Array(await thumb.arrayBuffer()), { level: 0 }];
    }
    out.push({ ...rest, thumbFile });
  }
  return out;
}

function unpackFoods(list: FoodJSON[], raw: Unzipped): Food[] {
  return list.map(({ thumbFile, ...f }) => ({
    ...f,
    thumb: thumbFile && raw[thumbFile] ? new Blob([raw[thumbFile] as BlobPart], { type: 'image/jpeg' }) : undefined,
  }));
}

export async function createBackup(): Promise<File> {
  const [foods, entries, days, weights, supplements, templates, checkins, settings, gymSessions] = await Promise.all([
    db.foods.toArray(),
    db.entries.toArray(),
    db.days.toArray(),
    db.weights.toArray(),
    db.supplements.toArray(),
    db.templates.toArray(),
    db.checkins.toArray(),
    db.settings.toArray(),
    db.gymSessions.toArray(),
  ]);
  const files: Files = {};
  const json: BackupJSON = {
    format: FORMAT,
    version: VERSION,
    exportedAt: Date.now(),
    foods: await packFoods(foods, files),
    entries,
    days,
    weights,
    supplements,
    templates,
    checkins,
    settings: settings.filter((s) => !PRIVATE_SETTINGS.has(s.key)),
    gymSessions,
  };
  files['datos.json'] = strToU8(JSON.stringify(json));
  const data = await zipAsync(files);
  return new File([data as BlobPart], `fisico-copia-${isoDate()}.zip`, { type: 'application/zip' });
}

export interface BackupSummary {
  json: BackupJSON;
  raw: Unzipped;
}

export async function readBackup(file: File): Promise<BackupSummary> {
  const raw = await unzipAsync(new Uint8Array(await file.arrayBuffer()));
  const entry = raw['datos.json'];
  if (!entry) throw new Error('El archivo no es una copia de seguridad de Físico (o Nutri).');
  const json = JSON.parse(strFromU8(entry)) as BackupJSON;
  if (json.format !== FORMAT) {
    if ((json as { format?: string }).format === FOODS_FORMAT) throw new Error('Este archivo contiene alimentos compartidos: impórtalo en «Importar alimentos».');
    throw new Error('El archivo no es una copia de seguridad de Físico (o Nutri).');
  }
  if (json.version > VERSION) throw new Error('La copia es de una versión más nueva de la app. Actualízala primero.');
  return { json, raw };
}

export async function restoreBackup({ json, raw }: BackupSummary) {
  const apiKey = await db.settings.get('apiKey');
  const tables = [db.foods, db.entries, db.days, db.weights, db.supplements, db.templates, db.checkins, db.settings, db.gymSessions];
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()));
    await db.foods.bulkPut(unpackFoods(json.foods, raw));
    await db.entries.bulkPut(json.entries);
    await db.days.bulkPut(json.days);
    await db.weights.bulkPut(json.weights);
    await db.supplements.bulkPut(json.supplements);
    await db.templates.bulkPut(json.templates);
    await db.checkins.bulkPut(json.checkins);
    await db.settings.bulkPut(json.settings);
    await db.gymSessions.bulkPut(json.gymSessions ?? []);
    if (apiKey) await db.settings.put(apiKey);
  });
}

/** Exporta tus alimentos propios y recetas (con sus ingredientes) para compartirlos con otra persona. */
export async function exportFoods(): Promise<{ file: File; count: number }> {
  const all = (await db.foods.toArray()).filter((f) => !f.deletedAt);
  const own = all.filter((f) => f.source !== 'generico');
  const ids = new Set(own.map((f) => f.id));
  for (const f of own) for (const it of f.recipe?.items ?? []) ids.add(it.foodId);
  const list = all.filter((f) => ids.has(f.id)).map((f) => ({ ...f, favorite: undefined, useCount: undefined, lastUsedAt: undefined, lastGrams: undefined }));
  const files: Files = {};
  const foods = await packFoods(list, files);
  files['datos.json'] = strToU8(JSON.stringify({ format: FOODS_FORMAT, version: VERSION, exportedAt: Date.now(), foods }));
  const data = await zipAsync(files);
  return { file: new File([data as BlobPart], `fisico-alimentos-${isoDate()}.zip`, { type: 'application/zip' }), count: own.length };
}

/** Importa alimentos compartidos: añade los nuevos y actualiza los que coinciden por id o código de barras. */
export async function importFoods(file: File): Promise<{ added: number; updated: number }> {
  const raw = await unzipAsync(new Uint8Array(await file.arrayBuffer()));
  const entry = raw['datos.json'];
  const json = entry ? JSON.parse(strFromU8(entry)) : null;
  if (!json || json.format !== FOODS_FORMAT) throw new Error('El archivo no contiene alimentos de Físico (o Nutri).');
  const incoming = unpackFoods(json.foods as FoodJSON[], raw);
  let added = 0;
  let updated = 0;
  await db.transaction('rw', db.foods, async () => {
    for (const f of incoming) {
      const byId = await db.foods.get(f.id);
      const byCode = !byId && f.barcode ? await db.foods.where('barcode').equals(f.barcode).first() : undefined;
      const cur = byId ?? byCode;
      if (cur) {
        if (cur.source === 'generico') continue;
        await db.foods.put({ ...f, id: cur.id, favorite: cur.favorite, useCount: cur.useCount, lastUsedAt: cur.lastUsedAt, lastGrams: cur.lastGrams, deletedAt: undefined });
        updated++;
      } else {
        await db.foods.put({ ...f, deletedAt: undefined });
        added++;
      }
    }
  });
  return { added, updated };
}

export async function shareOrDownload(file: File): Promise<'shared' | 'downloaded' | 'cancelled' | 'needs-gesture'> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: file.name });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
      if ((e as Error).name === 'NotAllowedError') return 'needs-gesture';
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}
