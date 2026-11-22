import type { ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className="segmented" style={{ ['--n' as string]: options.length, ['--i' as string]: idx }}>
      <span className="segmented__thumb" />
      {options.map((o) => (
        <button key={o.value} className={o.value === value ? 'is-active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  tone,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  tone?: 'secondary';
}) {
  return (
    <button className={`chip ${active ? 'is-active' : ''} ${tone === 'secondary' ? 'chip--secondary' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
}) {
  return (
    <div className="stepper">
      <button aria-label="Menos" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>
        <Minus size={16} strokeWidth={2.6} />
      </button>
      <span className="stepper__value">{format ? format(value) : value}</span>
      <button aria-label="Más" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
        <Plus size={16} strokeWidth={2.6} />
      </button>
    </div>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={value} className={`toggle ${value ? 'is-on' : ''}`} onClick={() => onChange(!value)}>
      <span />
    </button>
  );
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty__icon">{icon}</div>}
      <div className="empty__title">{title}</div>
      {text && <div className="empty__text">{text}</div>}
      {action}
    </div>
  );
}
