import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { fmtKg } from '../../lib/format';
import { cleanNum, parseNum } from '../../ui/fields';

/** Número grande con − / + para usar con una mano; tocando el número se escribe con el teclado. */
export function BigNumber({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  decimal = true,
  suffix,
  placeholder = '—',
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
  min?: number;
  decimal?: boolean;
  suffix?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(value == null ? '' : fmtKg(value));
  useEffect(() => {
    if (parseNum(text) !== value) setText(value == null ? '' : fmtKg(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const bump = (d: number) => {
    const base = value ?? 0;
    const n = Math.max(min, Math.round((base + d) * 100) / 100);
    onChange(n);
  };
  return (
    <div className="bignum">
      <span className="bignum__label">{label}</span>
      <div className="bignum__row">
        <button className="bignum__btn" onClick={() => bump(-step)} aria-label={`Restar ${fmtKg(step)}`}>
          <Minus size={22} strokeWidth={2.6} />
        </button>
        <label className="bignum__value">
          <input
            inputMode={decimal ? 'decimal' : 'numeric'}
            value={text}
            placeholder={placeholder}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              const t = cleanNum(e.target.value, decimal).replace(/^(-?)/, '');
              setText(t);
              onChange(parseNum(t));
            }}
          />
          {suffix && <small>{suffix}</small>}
        </label>
        <button className="bignum__btn" onClick={() => bump(step)} aria-label={`Sumar ${fmtKg(step)}`}>
          <Plus size={22} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}
