import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Droplet, Flame, Minus, Pill, Scale } from 'lucide-react';
import { db } from '../../db/db';
import type { DayLog, Supplement } from '../../db/types';
import { setWeight, updateDay } from '../../db/actions';
import { addDays, fmtKg, isoDate } from '../../lib/format';
import { cleanNum, parseNum } from '../../ui/fields';
import { PromptSheet } from '../../ui/PromptSheet';
import { toast } from '../../ui/uiStore';
import { weightTrend } from '../../lib/adaptive';

export function WaterCard({ day, goalMl }: { day: DayLog; goalMl: number }) {
  const [custom, setCustom] = useState(false);
  const pct = goalMl > 0 ? Math.min(1, day.waterMl / goalMl) : 0;
  const add = (ml: number) =>
    void updateDay(day.date, (d) => {
      d.waterMl = Math.max(0, d.waterMl + ml);
    });
  return (
    <section className="card water">
      <div className="card__head">
        <span className="card__icon card__icon--water">
          <Droplet size={18} />
        </span>
        <span className="card__title">Agua</span>
        <span className="card__value">
          <b>{fmtKg(Math.round(day.waterMl / 100) / 10)}</b> / {fmtKg(goalMl / 1000)} L
        </span>
      </div>
      <div className="water__bar">
        <span style={{ transform: `scaleX(${pct})` }} />
      </div>
      <div className="water__btns">
        <button className="water__btn water__btn--minus" onClick={() => add(-250)} disabled={day.waterMl <= 0} aria-label="Quitar 250 ml">
          <Minus size={18} />
        </button>
        <button className="water__btn" onClick={() => add(250)}>
          +250 ml
        </button>
        <button className="water__btn" onClick={() => add(500)}>
          +500 ml
        </button>
        <button className="water__btn" onClick={() => setCustom(true)}>
          Otra
        </button>
      </div>
      <PromptSheet
        open={custom}
        title="Añadir agua (ml)"
        placeholder="330"
        inputMode="numeric"
        confirmText="Añadir"
        onClose={() => setCustom(false)}
        onSubmit={(v) => {
          const ml = parseNum(cleanNum(v));
          if (ml && ml > 0 && ml < 5000) add(ml);
        }}
      />
    </section>
  );
}

/** Días seguidos (hasta hoy o ayer) con el suplemento tomado. */
function streakFor(id: string, days: DayLog[], today: string): number {
  const taken = new Set(days.filter((d) => d.supplements?.[id]).map((d) => d.date));
  let n = 0;
  let cur = taken.has(today) ? today : addDays(today, -1);
  while (taken.has(cur)) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

export function SupplementsCard({ day, supplements }: { day: DayLog; supplements: Supplement[] }) {
  const today = isoDate();
  const recent = useLiveQuery(() => db.days.where('date').aboveOrEqual(addDays(today, -400)).toArray(), [today], []);
  const active = supplements.filter((s) => s.active);
  if (!active.length) return null;
  const done = active.filter((s) => day.supplements?.[s.id]).length;
  return (
    <section className="card">
      <div className="card__head">
        <span className="card__icon card__icon--supp">
          <Pill size={18} />
        </span>
        <span className="card__title">Suplementos</span>
        <span className="card__value">
          <b>{done}</b> / {active.length}
        </span>
      </div>
      <div className="supps">
        {active.map((s) => {
          const on = !!day.supplements?.[s.id];
          const streak = streakFor(s.id, recent, today);
          return (
            <button
              key={s.id}
              className={`supp ${on ? 'is-on' : ''}`}
              onClick={() =>
                void updateDay(day.date, (d) => {
                  d.supplements = { ...(d.supplements ?? {}) };
                  if (d.supplements[s.id]) delete d.supplements[s.id];
                  else d.supplements[s.id] = Date.now();
                })
              }
            >
              <span className="supp__check">{on && <Check size={16} strokeWidth={3} />}</span>
              <span className="supp__text">
                <span className="supp__name">{s.name}</span>
                <span className="supp__dose">
                  {fmtKg(s.dose)} {s.unit}
                  {s.time ? ` · ${s.time}` : ''}
                  {s.reminders?.length ? ` · 🔔 ${s.reminders.join(', ')}` : ''}
                </span>
              </span>
              {streak > 1 && (
                <span className="supp__streak">
                  <Flame size={13} /> {streak}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function WeightCard({ date }: { date: string }) {
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), [], []);
  const today = weights.find((w) => w.date === date);
  const [value, setValue] = useState('');
  const [editing, setEditing] = useState(false);
  const trend = weightTrend(weights, date);
  const t = trend[trend.length - 1];
  const weekAgo = trend[trend.length - 8];
  const delta = t && weekAgo ? t.trend - weekAgo.trend : null;
  const save = async () => {
    const kg = parseNum(value);
    if (!kg || kg < 30 || kg > 300) return toast('Escribe un peso válido');
    await setWeight(date, kg);
    setEditing(false);
    toast('Peso guardado', { tone: 'success', duration: 1500 });
  };
  return (
    <section className="card">
      <div className="card__head">
        <span className="card__icon card__icon--weight">
          <Scale size={18} />
        </span>
        <span className="card__title">Peso{date === isoDate() ? ' de hoy' : ''}</span>
        {today && !editing && (
          <button
            className="card__value card__value--btn"
            onClick={() => {
              setValue(fmtKg(today.kg));
              setEditing(true);
            }}
          >
            <b>{fmtKg(today.kg)}</b> kg
          </button>
        )}
      </div>
      {(!today || editing) && (
        <form
          className="weight__form"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="unit-input">
            <input inputMode="decimal" placeholder="Ej.: 78,4" value={value} onChange={(e) => setValue(cleanNum(e.target.value))} />
            <span>kg</span>
          </div>
          <button className="btn btn--primary" disabled={!value}>
            Guardar
          </button>
        </form>
      )}
      {t && (
        <p className="weight__trend">
          Tendencia: <b>{fmtKg(Math.round(t.trend * 10) / 10)} kg</b>
          {delta != null && (
            <>
              {' '}
              · {delta >= 0 ? '+' : '−'}
              {fmtKg(Math.abs(Math.round(delta * 100) / 100))} kg en 7 días
            </>
          )}
        </p>
      )}
      {!today && <p className="hint">Pésate por la mañana, en ayunas y después de ir al baño: así la tendencia es fiable.</p>}
    </section>
  );
}
