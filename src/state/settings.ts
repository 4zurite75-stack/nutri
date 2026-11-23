import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Meal, Profile, Targets } from '../db/types';
import type { ProgramConfig } from '../gym/types';

export type AiModel = 'claude-opus-5-5' | 'claude-haiku-5-5';

export interface Settings {
  profile: Profile | null;
  targets: Targets | null;
  meals: Meal[];
  apiKey: string;
  aiModel: AiModel;
  lastBackupAt: number;
  lastCheckInAt: number;
  program: ProgramConfig | null;
  stepsGoal: number;
}

export const DEFAULT_MEALS: Meal[] = [
  { id: 'desayuno', name: 'Desayuno' },
  { id: 'comida', name: 'Comida' },
  { id: 'merienda', name: 'Merienda' },
  { id: 'cena', name: 'Cena' },
  { id: 'snacks', name: 'Snacks' },
];

export const DEFAULT_SETTINGS: Settings = {
  profile: null,
  targets: null,
  meals: DEFAULT_MEALS,
  apiKey: '',
  aiModel: 'claude-opus-5-5',
  lastBackupAt: 0,
  lastCheckInAt: 0,
  program: null,
  stepsGoal: 8000,
};

export async function getSettings(): Promise<Settings> {
  const rows = await db.settings.toArray();
  const s: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[r.key] = r.value;
  return s as unknown as Settings;
}

const LOADING = { ...DEFAULT_SETTINGS, loading: true } as Settings & { loading?: boolean };
/** Últimos ajustes leídos: así las pantallas nuevas no empiezan con valores vacíos. */
let cache: Settings | null = null;

export function useSettings(): Settings & { loading?: boolean } {
  return useLiveQuery(
    async () => {
      cache = await getSettings();
      return cache;
    },
    [],
    cache ?? LOADING,
  );
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await db.settings.put({ key, value });
}
