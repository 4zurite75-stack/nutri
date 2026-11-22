import { create } from 'zustand';
import type { ReactNode } from 'react';

export type Tab = 'hoy' | 'alimentos' | 'progreso' | 'ajustes';

export interface StackEntry {
  key: number;
  render: () => ReactNode;
  leaving?: boolean;
}

interface NavState {
  tab: Tab;
  stacks: Record<Tab, StackEntry[]>;
  setTab: (t: Tab) => void;
  push: (render: () => ReactNode) => void;
  pop: () => void;
  popToRoot: (t?: Tab) => void;
}

let k = 0;
const POP_MS = 300;

export const useNav = create<NavState>((set, get) => ({
  tab: 'hoy',
  stacks: { hoy: [], alimentos: [], progreso: [], ajustes: [] },
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
