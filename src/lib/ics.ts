import type { Supplement } from '../db/types';
import { fmtKg, isoDate } from './format';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Recordatorios activos, ordenados por hora. */
export function reminderList(supps: Supplement[]) {
  return supps
    .filter((s) => s.active)
    .flatMap((s) => (s.reminders ?? []).map((time) => ({ supp: s, time })))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Calendario con un evento diario por cada hora de aviso. La hora es "flotante" (sin zona),
 * así el iPhone la entiende en su hora local, también con el cambio de horario.
 */
export function buildIcs(supps: Supplement[], from = isoDate()): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const day = from.replace(/-/g, '');
  const ev = reminderList(supps).map(({ supp, time }) => {
    const hm = time.replace(':', '');
    const what = `${supp.name} · ${fmtKg(supp.dose)} ${supp.unit}`;
    return [
      'BEGIN:VEVENT',
      `UID:fisico-${supp.id}-${hm}@fisico`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${day}T${hm}00`,
      'DURATION:PT5M',
      'RRULE:FREQ=DAILY',
      `SUMMARY:${esc(`💊 ${what}`)}`,
      `DESCRIPTION:${esc('Recordatorio de Físico. Cuando lo tomes, márcalo en la app.')}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(what)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fisico//Suplementos//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Suplementos', ...ev, 'END:VCALENDAR', ''].join(
    '\r\n',
  );
}

export const icsFile = (supps: Supplement[]) => new File([buildIcs(supps)], 'suplementos-fisico.ics', { type: 'text/calendar' });

/** Abre el archivo: en el iPhone sale la vista previa con «Añadir todo» al Calendario. */
export function openIcs(supps: Supplement[]) {
  const url = URL.createObjectURL(new Blob([buildIcs(supps)], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'suplementos-fisico.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
