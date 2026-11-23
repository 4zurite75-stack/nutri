import type { Feel } from '../types';

export const FEEL_ROWS: { key: keyof Feel; label: string; lo: string; hi: string; emoji: string }[] = [
  { key: 'energy', label: 'Energía', lo: 'Sin fuerzas', hi: 'A tope', emoji: '⚡' },
  { key: 'sleep', label: 'Sueño de anoche', lo: 'Fatal', hi: 'Genial', emoji: '😴' },
  { key: 'pain', label: 'Molestias', lo: 'Ninguna', hi: 'Muchas', emoji: '🩹' },
];

/** Sensaciones de la sesión del 1 al 5. */
export function FeelPicker({ value, onChange }: { value: Feel | undefined; onChange: (f: Feel) => void }) {
  const v = value ?? {};
  return (
    <div className="feel">
      {FEEL_ROWS.map((r) => (
        <div key={r.key} className="feel__row">
          <span className="feel__label">
            {r.emoji} {r.label}
          </span>
          <div className={`feel__opts feel__opts--${r.key}`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className={`feel__opt ${v[r.key] === n ? 'is-on' : ''}`} onClick={() => onChange({ ...v, [r.key]: v[r.key] === n ? undefined : n })}>
                {n}
              </button>
            ))}
          </div>
          <span className="feel__ends">
            <small>{r.lo}</small>
            <small>{r.hi}</small>
          </span>
        </div>
      ))}
    </div>
  );
}

/** «⚡4 · 😴3 · 🩹1» */
export function feelText(f: Feel | undefined): string {
  if (!f) return '';
  return FEEL_ROWS.filter((r) => f[r.key] != null)
    .map((r) => `${r.emoji}${f[r.key]}`)
    .join(' · ');
}
