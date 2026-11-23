import { create } from 'zustand';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getSettings } from '../state/settings';
import { buildSession } from './program';
import type { DayId, GymSession } from './types';
import { uid } from '../lib/id';

interface GymState {
  session: GymSession | null;
  loaded: boolean;
  expanded: boolean;
  load: () => Promise<void>;
  start: (week: number, day: DayId) => Promise<void>;
  mutate: (fn: (s: GymSession) => void) => void;
  setExpanded: (v: boolean) => void;
  finish: () => Promise<GymSession | null>;
  discard: () => Promise<void>;
}

let chain: Promise<unknown> = Promise.resolve();
const persist = (s: GymSession) => {
  chain = chain.then(() => db.gymSessions.put(s)).catch((e) => console.error('No se pudo guardar la sesión', e));
};

export const useGym = create<GymState>((set, get) => ({
  session: null,
  loaded: false,
  expanded: false,
  load: async () => {
    const s = await db.gymSessions.where('status').equals('active').first();
    set({ session: s ?? null, loaded: true });
  },
  start: async (week, day) => {
    const cfg = (await getSettings()).program;
    if (!cfg) return;
    const history = await db.gymSessions.toArray();
    const s = buildSession(week, day, history, cfg, uid());
    await db.gymSessions.put(s);
    set({ session: s, expanded: true });
  },
  mutate: (fn) => {
    const cur = get().session;
    if (!cur) return;
    const next = structuredClone(cur);
    fn(next);
    set({ session: next });
    persist(next);
  },
  setExpanded: (v) => set({ expanded: v }),
  finish: async () => {
    const s = get().session;
    if (!s) return null;
    const done = structuredClone(s);
    done.status = 'done';
    done.endedAt = Date.now();
    done.rest = null;
    await chain;
    await db.gymSessions.put(done);
    set({ session: null, expanded: false });
    return done;
  },
  discard: async () => {
    const s = get().session;
    set({ session: null, expanded: false });
    if (s) {
      await chain;
      await db.gymSessions.delete(s.id);
    }
  },
}));

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    const s = useGym.getState().session;
    if (s) persist(s);
  }
});

export function useGymSessions(): GymSession[] | undefined {
  return useLiveQuery(() => db.gymSessions.toArray(), []);
}
