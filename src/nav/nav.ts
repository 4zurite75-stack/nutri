import { create } from 'zustand';
import type { ReactNode } from 'react';

export type Mode = 'gym' | 'michi' | 'nutri';
export type Tab = 'hoy' | 'alimentos' | 'progreso' | 'ajustes' | 'g-hoy' | 'g-programa' | 'g-historial' | 'g-progreso' | 'm-michi';

export const MODE_TABS: Record<Mode, Tab[]> = {
  gym: ['g-hoy', 'g-programa', 'g-historial', 'g-progreso', 'ajustes'],
  michi: ['m-michi', 'ajustes'],
  nutri: ['hoy', 'alimentos', 'progreso', 'ajustes'],
};

export interface StackEntry {
  key: number;
  render: () => ReactNode;
  leaving?: boolean;
}

interface NavState {
  mode: Mode;
  tab: Tab;
  lastTab: Record<Mode, Tab>;
  stacks: Record<Tab, StackEntry[]>;
  setMode: (m: Mode) => void;
  setTab: (t: Tab) => void;
  push: (render: () => ReactNode) => void;
  pop: () => void;
  popToRoot: (t?: Tab) => void;
}

let k = 0;
const POP_MS = 300;

function storedMode(): Mode {
  try {
    const m = localStorage.getItem('fisico-mode');
    if (m === 'gym' || m === 'michi' || m === 'nutri') return m;
  } catch {
    /* sin almacenamiento */
  }
  return 'gym';
}

export function applyModeColor(m: Mode) {
  document.documentElement.dataset.mode = m;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', '#000000');
}

const initialMode = storedMode();
applyModeColor(initialMode);

export const useNav = create<NavState>((set, get) => ({
  mode: initialMode,
  tab: MODE_TABS[initialMode][0],
  lastTab: { gym: 'g-hoy', michi: 'm-michi', nutri: 'hoy' },
  stacks: { hoy: [], alimentos: [], progreso: [], ajustes: [], 'g-hoy': [], 'g-programa': [], 'g-historial': [], 'g-progreso': [], 'm-michi': [] },
  setMode: (m) => {
    const { mode, tab, lastTab } = get();
    if (m === mode) return;
    try {
      localStorage.setItem('fisico-mode', m);
    } catch {
      /* nada */
    }
    applyModeColor(m);
    set({ mode: m, tab: lastTab[m], lastTab: { ...lastTab, [mode]: tab } });
  },
  setTab: (t) => {
    if (get().tab === t) get().popToRoot(t);
    else set({ tab: t });
  },
  push: (render) => {
    const { tab, stacks } = get();
    set({ stacks: { ...stacks, [tab]: [...stacks[tab], { key: ++k, render }] } });
  },
  pop: () => {
    const { tab, stacks } = get();
    const st = stacks[tab];
    const top = st.findLast((e) => !e.leaving);
    if (!top) return;
    set({ stacks: { ...stacks, [tab]: st.map((e) => (e === top ? { ...e, leaving: true } : e)) } });
    setTimeout(() => {
      const s = get().stacks;
      set({ stacks: { ...s, [tab]: s[tab].filter((e) => e.key !== top.key) } });
    }, POP_MS);
  },
  popToRoot: (t) => {
    const tab = t ?? get().tab;
    const { stacks } = get();
    if (stacks[tab].length === 0) return;
    set({ stacks: { ...stacks, [tab]: stacks[tab].map((e) => ({ ...e, leaving: true })) } });
    setTimeout(() => set({ stacks: { ...get().stacks, [tab]: [] } }), POP_MS);
  },
}));

export const push = (render: () => ReactNode) => useNav.getState().push(render);
export const pop = () => useNav.getState().pop();
