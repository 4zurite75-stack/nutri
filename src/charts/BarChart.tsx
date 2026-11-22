import { useState } from 'react';
import { niceTicks, useWidth } from './useWidth';
import { fmtNum } from '../lib/format';

export interface Bar {
  label: string;
  value: number;
  tip: string;
  highlight?: boolean;
}

const PAD = { l: 30, r: 6, t: 18, b: 24 };

/** Barras verticales con extremo redondeado de 4 px y una separación de 2 px. */
export function BarChart({
  bars,
  height = 170,
  fmtV = fmtNum,
  refValue,
  refLabel,
}: {
  bars: Bar[];
  height?: number;
  fmtV?: (v: number) => string;
  /** Línea de referencia (p. ej. el objetivo). */
  refValue?: number;
  refLabel?: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(1, refValue ?? 0, ...bars.map((b) => b.value));
  const ticks = niceTicks(0, max, 3).filter((t) => t >= 0);
  const top = ticks[ticks.length - 1];
  const iw = width - PAD.l - PAD.r;
  const ih = height - PAD.t - PAD.b;
  const slot = iw / Math.max(1, bars.length);
  const bw = Math.min(28, slot - 8);
  const sy = (v: number) => PAD.t + (1 - v / top) * ih;
  const last = bars.length - 1;

  return (
    <div className="lchart" ref={ref} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Gráfica de barras">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={width - PAD.r} y1={sy(t)} y2={sy(t)} className="lchart__grid" />
              <text x={PAD.l - 6} y={sy(t)} className="lchart__ylab" dominantBaseline="middle" textAnchor="end">
                {fmtV(t)}
              </text>
            </g>
          ))}
          {refValue != null && refValue > 0 && (
            <g>
              <line x1={PAD.l} x2={width - PAD.r} y1={sy(refValue)} y2={sy(refValue)} className="bchart__ref" />
              {refLabel && (
                <text x={width - PAD.r} y={sy(refValue) - 5} textAnchor="end" className="bchart__reflab">
                  {refLabel}
                </text>
              )}
            </g>
          )}
          {bars.map((b, i) => {
            const x = PAD.l + slot * i + (slot - bw) / 2;
            const h = Math.max(0, (b.value / top) * ih);
            const y = PAD.t + ih - h;
            const r = Math.min(4, h, bw / 2);
            const d =
              h <= 0
                ? ''
                : `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${y + h}Z`;
            return (
              <g key={i} onPointerDown={() => setSel(sel === i ? null : i)} className="bchart__slot">
                <rect x={PAD.l + slot * i} y={PAD.t} width={slot} height={ih} fill="transparent" />
                <path d={d} className={`bchart__bar ${b.highlight ? 'is-hl' : ''} ${sel === i ? 'is-sel' : ''}`} />
                {(bars.length <= 6 || i % 2 === last % 2) && (
                  <text x={x + bw / 2} y={height - 6} className="lchart__xlab" textAnchor="middle">
                    {b.label}
                  </text>
                )}
                {(i === last || sel === i) && b.value > 0 && (
                  <text x={x + bw / 2} y={y - 6} className="bchart__val" textAnchor="middle">
                    {fmtV(b.value)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {sel != null && bars[sel] && <div className="bchart__tip">{bars[sel].tip}</div>}
    </div>
  );
}
