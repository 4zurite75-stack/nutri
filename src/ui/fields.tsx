import type { ReactNode } from 'react';

export function parseNum(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

export const cleanNum = (s: string, decimal = true) => s.replace(decimal ? /[^\d.,]/g : /[^\d]/g, '');

/** Campo numérico con unidad a la derecha (teclado numérico de iOS). */
export function NumField({
  label,
  value,
  onChange,
  unit,
  decimal = true,
  placeholder,
  hint,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  decimal?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="numfield">
      <span className="numfield__label">
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <span className="numfield__box">
        <input
          inputMode={decimal ? 'decimal' : 'numeric'}
          value={value}
          placeholder={placeholder ?? '—'}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => onChange(cleanNum(e.target.value, decimal))}
        />
        {unit && <span>{unit}</span>}
      </span>
    </label>
  );
}
