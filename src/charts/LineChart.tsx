import { useMemo, useRef, useState } from 'react';
import { niceTicks, useWidth } from './useWidth';
import { fmtDateShort, fmtNum } from '../lib/format';

export interface Pt {
  x: number; // timestamp
  y: number;
}

export interface LineSeries {
  name: string;
  points: Pt[];
  /** Serie secundaria (p. ej. media móvil): línea gris, sin puntos. */
  muted?: boolean;
}

interface Props {
  series: LineSeries[];
  height?: number;
  unit?: string;
  fmtY?: (v: number) => string;
  /** Texto extra del tooltip para el punto de la serie principal. */
  detail?: (i: number) => string | undefined;
}

const PAD = { l: 44, r: 14, t: 14, b: 26 };

export function LineChart({ series, height = 210, unit = '', fmtY = fmtNum, detail }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const hideTimer = useRef<number>(0);
  const main = series[0];

  const geo = useMemo(() => {
    const all = series.flatMap((s) => s.points);
    if (!all.length || width === 0) return null;
    let x0 = Math.min(...all.map((p) => p.x));
    let x1 = Math.max(...all.map((p) => p.x));
    if (x0 === x1) {
      x0 -= 86400000 * 3;
      x1 += 86400000 * 3;
    }
    const ys = all.map((p) => p.y);
    const span = Math.max(...ys) - Math.min(...ys);
    const ticks = niceTicks(Math.min(...ys) - span * 0.08, Math.max(...ys) + span * 0.08, 4);
    const y0 = ticks[0];
    const y1 = ticks[ticks.length - 1];
    const iw = width - PAD.l - PAD.r;
    const ih = height - PAD.t - PAD.b;
    const sx = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * iw;
    const sy = (y: number) => PAD.t + (1 - (y - y0) / (y1 - y0 || 1)) * ih;
    const xTicks = [0, 0.5, 1].map((f) => x0 + (x1 - x0) * f);
    return { sx, sy, ticks, xTicks, iw, ih };
  }, [series, width, height]);

  const path = (pts: Pt[]) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${geo!.sx(p.x).toFixed(1)},${geo!.sy(p.y).toFixed(1)}`).join('');

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!geo || !main.points.length) return;
    window.clearTimeout(hideTimer.current);
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0;
    let bd = Infinity;
    main.points.forEach((p, i) => {
      const d = Math.abs(geo.sx(p.x) - px);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setHover(best);
  };
  const onLeave = (e: React.PointerEvent) => {
    const delay = e.pointerType === 'touch' ? 1800 : 0;
    hideTimer.current = window.setTimeout(() => setHover(null), delay);
  };

  const hp = hover != null ? main.points[hover] : null;
  const showDots = main.points.length <= 40;

  return (
    <div className="lchart" ref={ref} style={{ height }}>
      {geo && (
        <svg
          width={width}
          height={height}
          onPointerDown={onMove}
          onPointerMove={onMove}
          onPointerUp={onLeave}
          onPointerLeave={onLeave}
          onPointerCancel={onLeave}
          role="img"
          aria-label={`Gráfica de ${main.name}`}
        >
          <defs>
            <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={width - PAD.r} y1={geo.sy(t)} y2={geo.sy(t)} className="lchart__grid" />
              <text x={PAD.l - 8} y={geo.sy(t)} className="lchart__ylab" dominantBaseline="middle" textAnchor="end">
                {fmtY(t)}
              </text>
            </g>
          ))}
          {geo.xTicks.map((t, i) => (
            <text
              key={i}
              x={geo.sx(t)}
              y={height - 6}
              className="lchart__xlab"
              textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
            >
              {fmtDateShort(t)}
            </text>
          ))}
          {main.points.length > 1 && (
            <path
              d={`${path(main.points)}L${geo.sx(main.points[main.points.length - 1].x)},${PAD.t + geo.ih}L${geo.sx(main.points[0].x)},${PAD.t + geo.ih}Z`}
              fill="url(#lc-fill)"
            />
          )}
          {series
            .slice()
            .reverse()
            .map((s) => (
              <path key={s.name} d={path(s.points)} className={`lchart__line ${s.muted ? 'is-muted' : ''}`} />
            ))}
          {showDots &&
            main.points.map((p, i) => (
              <circle key={i} cx={geo.sx(p.x)} cy={geo.sy(p.y)} r={i === main.points.length - 1 ? 5 : 3.5} className="lchart__dot" />
            ))}
          {hp && (
            <g>
              <line x1={geo.sx(hp.x)} x2={geo.sx(hp.x)} y1={PAD.t} y2={PAD.t + geo.ih} className="lchart__cross" />
              <circle cx={geo.sx(hp.x)} cy={geo.sy(hp.y)} r={6} className="lchart__dot is-hover" />
            </g>
          )}
        </svg>
      )}
      {geo && hp && (
        <div
          className="lchart__tip"
          style={{
            left: Math.min(Math.max(geo.sx(hp.x), 70), width - 70),
            top: Math.max(0, geo.sy(hp.y) - 64),
          }}
        >
          <strong>
            {fmtY(hp.y)}
            {unit && ` ${unit}`}
          </strong>
          <span>{fmtDateShort(hp.x)}</span>
          {detail?.(hover!) && <span>{detail(hover!)}</span>}
        </div>
      )}
      {series.length > 1 && (
        <div className="lchart__legend">
          {series.map((s) => (
            <span key={s.name}>
              <i className={s.muted ? 'is-muted' : ''} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
