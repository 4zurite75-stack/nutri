import { useMemo, useState } from 'react';
import type { Activity, Goal, Profile, Sex } from '../../db/types';
import { ACTIVITY, DEFAULT_RATE, GOAL_LABEL, RATE_OPTIONS } from '../../lib/nutrition';
import { Segmented, Stepper } from '../../ui/controls';
import { NumField, parseNum } from '../../ui/fields';
import { fmtKg } from '../../lib/format';

export interface ProfileDraft {
  name: string;
  sex: Sex;
  age: string;
  height: string;
  weight: string;
  bodyFat: string;
  activity: Activity;
  trainingDays: number;
  goal: Goal;
  ratePct: number;
}

export function draftFrom(p: Profile | null, currentWeight?: number): ProfileDraft {
  return {
    name: p?.name ?? '',
    sex: p?.sex ?? 'hombre',
    age: p ? String(new Date().getFullYear() - p.birthYear) : '',
    height: p ? String(p.heightCm) : '',
    weight: currentWeight != null ? fmtKg(Math.round(currentWeight * 10) / 10) : p ? fmtKg(p.startWeightKg) : '',
    bodyFat: p?.bodyFatPct ? fmtKg(p.bodyFatPct) : '',
    activity: p?.activity ?? 'ligero',
    trainingDays: p?.trainingDays ?? 4,
    goal: p?.goal ?? 'ganar',
    ratePct: p?.ratePct ?? DEFAULT_RATE.ganar,
  };
}

export function draftValid(d: ProfileDraft): string | null {
  const age = parseNum(d.age);
  const h = parseNum(d.height);
  const w = parseNum(d.weight);
  const bf = parseNum(d.bodyFat);
  if (!age || age < 14 || age > 90) return 'Indica una edad entre 14 y 90 años';
  if (!h || h < 130 || h > 230) return 'Indica tu altura en centímetros';
  if (!w || w < 35 || w > 250) return 'Indica tu peso en kg';
  if (bf != null && (bf < 4 || bf > 55)) return 'El % de grasa debe estar entre 4 y 55';
  return null;
}

export function profileFrom(d: ProfileDraft, prev: Profile | null): Profile {
  return {
    name: d.name.trim(),
    sex: d.sex,
    birthYear: new Date().getFullYear() - (parseNum(d.age) ?? 30),
    heightCm: parseNum(d.height) ?? 170,
    startWeightKg: prev?.startWeightKg ?? parseNum(d.weight) ?? 70,
    bodyFatPct: parseNum(d.bodyFat) ?? undefined,
    activity: d.activity,
    trainingDays: d.trainingDays,
    goal: d.goal,
    ratePct: d.ratePct,
    createdAt: prev?.createdAt ?? Date.now(),
  };
}

export function BodyFields({ d, set }: { d: ProfileDraft; set: (p: Partial<ProfileDraft>) => void }) {
  return (
    <div className="form">
      <label className="field">
        <span className="field__label">Nombre (opcional)</span>
        <input className="input" value={d.name} placeholder="Tu nombre" onChange={(e) => set({ name: e.target.value })} enterKeyHint="next" />
      </label>
      <div className="field">
        <span className="field__label">Sexo</span>
        <Segmented
          value={d.sex}
          onChange={(v) => set({ sex: v })}
          options={[
            { value: 'hombre', label: 'Hombre' },
            { value: 'mujer', label: 'Mujer' },
          ]}
        />
      </div>
      <div className="numfield-grid">
        <NumField label="Edad" value={d.age} onChange={(v) => set({ age: v })} unit="años" decimal={false} />
        <NumField label="Altura" value={d.height} onChange={(v) => set({ height: v })} unit="cm" decimal={false} />
        <NumField label="Peso" value={d.weight} onChange={(v) => set({ weight: v })} unit="kg" />
        <NumField label="% de grasa" hint="opcional" value={d.bodyFat} onChange={(v) => set({ bodyFat: v })} unit="%" />
      </div>
      <p className="hint" style={{ marginTop: -8 }}>
        El % de grasa solo si lo conoces de una báscula de bioimpedancia o una medición fiable: mejora el cálculo.
      </p>
    </div>
  );
}

export function ActivityFields({ d, set }: { d: ProfileDraft; set: (p: Partial<ProfileDraft>) => void }) {
  return (
    <div className="form">
      <div className="field">
        <span className="field__label">Actividad diaria (sin contar el gimnasio)</span>
        <div className="choice-list">
          {(Object.keys(ACTIVITY) as Activity[]).map((a) => (
            <button key={a} className={`choice ${d.activity === a ? 'is-active' : ''}`} onClick={() => set({ activity: a })}>
              <span className="choice__title">{ACTIVITY[a].label}</span>
              <span className="choice__desc">{ACTIVITY[a].desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="field field--row">
        <span className="field__label">Días de entreno de fuerza por semana</span>
        <Stepper value={d.trainingDays} min={0} max={7} onChange={(v) => set({ trainingDays: v })} />
      </div>
    </div>
  );
}

export function GoalFields({ d, set }: { d: ProfileDraft; set: (p: Partial<ProfileDraft>) => void }) {
  const weight = parseNum(d.weight) ?? 70;
  const options = RATE_OPTIONS[d.goal];
  const perWeek = useMemo(() => (weight * d.ratePct) / 100, [weight, d.ratePct]);
  return (
    <div className="form">
      <div className="field">
        <span className="field__label">Objetivo</span>
        <Segmented
          value={d.goal}
          onChange={(g) => set({ goal: g, ratePct: DEFAULT_RATE[g] })}
          options={(['perder', 'mantener', 'ganar'] as Goal[]).map((g) => ({ value: g, label: GOAL_LABEL[g] }))}
        />
      </div>
      {d.goal !== 'mantener' && (
        <div className="field">
          <span className="field__label">Ritmo</span>
          <div className="choice-list">
            {options.map((o) => (
              <button key={o.value} className={`choice ${d.ratePct === o.value ? 'is-active' : ''}`} onClick={() => set({ ratePct: o.value })}>
                <span className="choice__title">{o.label}</span>
                <span className="choice__desc">{o.desc}</span>
              </button>
            ))}
          </div>
          <p className="hint">
            Con tu peso: {perWeek > 0 ? '+' : '−'}
            {fmtKg(Math.abs(Math.round(perWeek * 100) / 100))} kg por semana · {perWeek > 0 ? '+' : '−'}
            {fmtKg(Math.abs(Math.round(perWeek * 4.3 * 10) / 10))} kg al mes.
          </p>
        </div>
      )}
    </div>
  );
}

export function useDraft(initial: ProfileDraft) {
  const [d, setD] = useState(initial);
  return [d, (p: Partial<ProfileDraft>) => setD((x) => ({ ...x, ...p })), setD] as const;
}
