const nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: true });
const nf1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

export const fmtNum = (n: number) => nf.format(n);
export const fmtInt = (n: number) => nf0.format(Math.round(n));
export const fmt1 = (n: number) => nf1.format(n);

export function fmtKg(n: number | null | undefined): string {
  if (n == null) return '';
  return nf.format(n);
}

/** Volumen con separador de miles siempre (12.450 kg). */
export function fmtVolume(kg: number): string {
  const s = Math.round(kg).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}




const dfLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const dfShort = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
const dfShortYear = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
const dfTime = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const fmtDateLong = (t: number | Date) => cap(dfLong.format(t));
export function fmtDateShort(t: number | Date): string {
  const d = new Date(t);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return (sameYear ? dfShort : dfShortYear).format(d).replace('.', '');
}
export const fmtTime = (t: number | Date) => dfTime.format(t);

export function relativeDay(t: number): string {
  const d = new Date(t);
  const today = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(today) - start(d)) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} días`;
  return fmtDateShort(t);
}

export function isoDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}



/** Entero con separador de miles siempre (2.350). */
export function fmtK(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Gramos con 0 decimales si ≥ 10 y 1 decimal si < 10 (6,5 g · 32 g). */
export function fmtG(n: number): string {
  if (Math.abs(n) >= 10) return fmtK(n);
  return fmt1(Math.round(n * 10) / 10);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

const dfDay = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

export function dayLabel(iso: string): string {
  const today = isoDate();
  if (iso === today) return 'Hoy';
  if (iso === addDays(today, -1)) return 'Ayer';
  if (iso === addDays(today, 1)) return 'Mañana';
  const s = dfDay.format(new Date(iso + 'T12:00:00')).replace(/\./g, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const isoToTs = (iso: string) => new Date(iso + 'T12:00:00').getTime();
