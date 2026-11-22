import type { Nutrients } from '../db/types';
import { fmtG, fmtK } from '../lib/format';

/** Anillo de calorías: consumido frente a objetivo. */
export function KcalRing({ value, target, size = typeof window !== 'undefined' && window.innerWidth < 380 ? 104 : 132 }: { value: number; target: number; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? value / target : 0;
  const over = pct > 1.03;
  const shown = Math.min(1, pct);
  const remaining = Math.round(target - value);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring__track" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={`ring__fill ${over ? 'is-over' : ''}`}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring__center">
        <span className="ring__value">{fmtK(Math.abs(remaining))}</span>
        <span className="ring__label">{remaining >= 0 ? 'kcal restantes' : 'kcal de más'}</span>
      </div>
    </div>
  );
}

export function MacroBar({ kind, label, value, target }: { kind: 'p' | 'c' | 'f'; label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <div className="mbar2">
      <div className="mbar2__top">
        <span className="mbar2__label">
          <i className={`dot dot--${kind}`} />
          {label}
        </span>
        <span className="mbar2__nums">
          <b>{fmtK(value)}</b> / {fmtK(target)} g
        </span>
      </div>
      <div className="mbar2__track">
        <span className={`mbar2__fill mbar2__fill--${kind}`} style={{ transform: `scaleX(${pct})` }} />
      </div>
    </div>
  );
}

/** Macros en una línea: punto de color + letra + gramos (el texto siempre en color neutro). */
export function MacroInline({ n, className = '' }: { n: Nutrients; className?: string }) {
  return (
    <span className={`minline ${className}`}>
      <span>
        <i className="dot dot--p" />P {fmtG(n.protein)}
      </span>
      <span>
        <i className="dot dot--c" />H {fmtG(n.carbs)}
      </span>
      <span>
        <i className="dot dot--f" />G {fmtG(n.fat)}
      </span>
    </span>
  );
}
