import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Page } from '../../ui/Page';
import { Chip } from '../../ui/controls';
import { db } from '../../db/db';
import { intakeByDate } from '../../db/actions';
import { useSettings } from '../../state/settings';
import { weightTrend } from '../../lib/adaptive';
import { addDays, dayLabel, fmtDateShort, fmtK, fmtKg, isoDate, isoToTs } from '../../lib/format';
import { LineChart } from '../../charts/LineChart';
import { BarChart } from '../../charts/BarChart';
import { CheckInCard } from './CheckInCard';
import { useAnalysis } from './useAnalysis';
import { GOAL_LABEL } from '../../lib/nutrition';

type Range = '1m' | '3m' | '6m' | 'all';
const RANGE_DAYS: Record<Range, number> = { '1m': 31, '3m': 92, '6m': 183, all: 100000 };

export function ProgresoHome() {
  const s = useSettings();
  const analysis = useAnalysis();
  const weights = useLiveQuery(() => db.weights.toArray(), [], []);
  const intake = useLiveQuery(intakeByDate, [], new Map());
  const checkins = useLiveQuery(() => db.checkins.orderBy('date').reverse().limit(8).toArray(), [], []);
  const [range, setRange] = useState<Range>('3m');
  const t = s.targets;
  const today = isoDate();

  const trend = useMemo(() => weightTrend(weights), [weights]);
  const shown = useMemo(() => {
    const from = isoToTs(addDays(today, -RANGE_DAYS[range]));
    return trend.filter((p) => p.t >= from);
  }, [trend, range, today]);

  const change = (days: number) => {
    if (trend.length < 2) return null;
    const end = trend[trend.length - 1];
    const start = trend[Math.max(0, trend.length - 1 - days)];
    return end.trend - start.trend;
  };

  const bars = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, i - 13);
      const v = intake.get(d)?.kcal ?? 0;
      return {
        label: new Date(isoToTs(d)).getDate().toString(),
        value: Math.round(v),
        tip: `${dayLabel(d)}: ${fmtK(v)} kcal`,
        highlight: d === today,
      };
    });
  }, [intake, today]);

  const weeks = useMemo(() => {
    if (!t) return [];
    return Array.from({ length: 4 }, (_, w) => {
      const end = addDays(today, -7 * w);
      const days = Array.from({ length: 7 }, (_, i) => addDays(end, -i)).filter((d) => d <= today);
      const logged = days.filter((d) => (intake.get(d)?.kcal ?? 0) >= t.kcal * 0.4);
      const avg = (k: 'kcal' | 'protein' | 'carbs' | 'fat') => (logged.length ? logged.reduce((a, d) => a + (intake.get(d)?.[k] ?? 0), 0) / logged.length : 0);
      const ok = logged.filter((d) => {
        const v = intake.get(d)!;
        return Math.abs(v.kcal - t.kcal) <= t.kcal * 0.1 && v.protein >= t.protein * 0.9;
      }).length;
      return { label: w === 0 ? 'Últimos 7 días' : `Hace ${w} sem.`, logged: logged.length, kcal: avg('kcal'), protein: avg('protein'), carbs: avg('carbs'), fat: avg('fat'), ok };
    });
  }, [intake, t, today]);

  const last = trend[trend.length - 1];
  const c7 = change(7);
  const c30 = change(30);
  const start = trend[0];

  return (
    <Page title="Progreso" large>
      {analysis && (
        <div className="hoy__cards" style={{ paddingTop: 0 }}>
          <CheckInCard a={analysis} compact />
        </div>
      )}

      <div className="section-head">
        <h2>Peso</h2>
        {s.profile && <span className="muted">{GOAL_LABEL[s.profile.goal]} · {fmtKg(s.profile.ratePct)} %/sem</span>}
      </div>
      <div className="chart-card">
        {trend.length === 0 ? (
          <p className="muted" style={{ padding: 20, textAlign: 'center' }}>
            Registra tu peso en la pestaña Hoy.
          </p>
        ) : (
          <>
            <div className="chart-card__head">
              <div>
                <div className="chart-card__value">
                  {fmtKg(Math.round(last.trend * 10) / 10)} <small>kg</small>
                </div>
                <div className="chart-card__sub">Tendencia actual</div>
              </div>
              <div className="wstats">
                {c7 != null && (
                  <span>
                    7 días <b>{c7 >= 0 ? '+' : '−'}{fmtKg(Math.abs(Math.round(c7 * 10) / 10))}</b>
                  </span>
                )}
                {c30 != null && trend.length > 20 && (
                  <span>
                    30 días <b>{c30 >= 0 ? '+' : '−'}{fmtKg(Math.abs(Math.round(c30 * 10) / 10))}</b>
                  </span>
                )}
                {start && trend.length > 7 && (
                  <span>
                    Total <b>{last.trend - start.trend >= 0 ? '+' : '−'}{fmtKg(Math.abs(Math.round((last.trend - start.trend) * 10) / 10))}</b>
                  </span>
                )}
              </div>
            </div>
            <LineChart
              series={[
                { name: 'Tendencia', points: shown.map((p) => ({ x: p.t, y: Math.round(p.trend * 10) / 10 })) },
                { name: 'Peso del día', points: shown.filter((p) => p.raw != null).map((p) => ({ x: p.t, y: p.raw! })), muted: true },
              ]}
              unit="kg"
              fmtY={(v) => fmtKg(Math.round(v * 10) / 10)}
            />
            <div className="chips-row">
              {(['1m', '3m', '6m', 'all'] as Range[]).map((r) => (
                <Chip key={r} active={range === r} onClick={() => setRange(r)}>
                  {r === 'all' ? 'Todo' : r.toUpperCase()}
                </Chip>
              ))}
            </div>
          </>
        )}
      </div>
      <p className="hint group-hint">La tendencia suaviza las subidas y bajadas diarias por agua y comida: es la que cuenta.</p>

      <div className="section-head">
        <h2>Calorías · 14 días</h2>
      </div>
      <div className="chart-card">
        <BarChart bars={bars} fmtV={fmtK} refValue={t?.kcal} refLabel={t ? `Objetivo ${fmtK(t.kcal)}` : undefined} />
      </div>

      {t && (
        <>
          <div className="section-head">
            <h2>Medias semanales</h2>
          </div>
          <div className="group weeks">
            {weeks.map((w) => (
              <div key={w.label} className="group__row week-row">
                <span className="week-row__label">
                  {w.label}
                  <small className="muted">
                    {w.logged}/7 días registrados · {w.ok} en objetivo
                  </small>
                </span>
                <span className="week-row__vals">
                  <b>{w.logged ? fmtK(w.kcal) : '—'}</b> kcal
                  <small className="muted">{w.logged ? `P ${fmtK(w.protein)} · H ${fmtK(w.carbs)} · G ${fmtK(w.fat)}` : ''}</small>
                </span>
              </div>
            ))}
          </div>
          <p className="hint group-hint">
            «En objetivo»: calorías a ±10 % del objetivo ({fmtK(t.kcal)}) y al menos el 90 % de la proteína ({t.protein} g).
          </p>
        </>
      )}

      {checkins.length > 0 && (
        <>
          <div className="group-title">Revisiones anteriores</div>
          <div className="group">
            {checkins.map((c) => (
              <div key={c.id} className="group__row">
                <span>
                  {fmtDateShort(isoToTs(c.date))}
                  <small className="muted" style={{ display: 'block' }}>
                    Ritmo {c.ratePct >= 0 ? '+' : '−'}
                    {fmtKg(Math.abs(Math.round(c.ratePct * 100) / 100))} %/sem · mantenimiento {fmtK(c.estTdee)}
                  </small>
                </span>
                <span className="group__value">{c.applied && c.toKcal !== c.fromKcal ? `${fmtK(c.fromKcal)} → ${fmtK(c.toKcal)}` : 'Sin cambios'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
