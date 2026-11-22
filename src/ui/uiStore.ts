import { create } from 'zustand';
import type { ReactNode } from 'react';

export interface ActionItem {
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  selected?: boolean;
  onSelect: () => void;
}

export interface ActionSheetReq {
  title?: string;
  message?: string;
  actions: ActionItem[];
}

export interface DialogReq {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  /** Botón extra (p. ej. "Descartar"). */
  altText?: string;
  resolve: (v: 'confirm' | 'cancel' | 'alt') => void;
}

export interface ToastReq {
  id: number;
  text: string;
  tone?: 'default' | 'success' | 'accent';
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
}

interface UIState {
  actionSheet: ActionSheetReq | null;
  dialog: DialogReq | null;
  toasts: ToastReq[];
}

export const useUI = create<UIState>(() => ({ actionSheet: null, dialog: null, toasts: [] }));

export function showActions(req: ActionSheetReq) {
  useUI.setState({ actionSheet: req });
}

export function ask(req: Omit<DialogReq, 'resolve'>): Promise<'confirm' | 'cancel' | 'alt'> {
  return new Promise((resolve) => useUI.setState({ dialog: { ...req, resolve } }));
}

export async function confirm(req: Omit<DialogReq, 'resolve' | 'altText'>): Promise<boolean> {
  return (await ask(req)) === 'confirm';
}

let toastId = 0;
export function toast(text: string, opts: Omit<ToastReq, 'id' | 'text'> & { duration?: number } = {}) {
  const id = ++toastId;
  useUI.setState((s) => ({ toasts: [...s.toasts, { id, text, tone: opts.tone, icon: opts.icon, action: opts.action }] }));
  setTimeout(() => useUI.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), opts.duration ?? 2600);
}
