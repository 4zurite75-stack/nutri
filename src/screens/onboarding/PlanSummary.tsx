import type { Profile } from '../../db/types';
import { ACTIVITY, calculate, type Calculation } from '../../lib/nutrition';
import { fmtK, fmtKg } from '../../lib/format';

export function MacroSplit({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9 || 1;
  const parts = [
    { k: 'p', label: 'Proteína', g: protein, kcal: protein * 4 },
    { k: 'c', label: 'Hidratos', g: carbs, kcal: carbs * 4 },
    { k: 'f', label: 'Grasa', g: fat, kcal: fat * 9 },
  ];
  return (
    <div className="split">
      <div className="split__bar">
        {parts.map((p) => (
          <span key={p.k} className={`split__seg split__seg--${p.k}`} style={{ flexGrow: p.kcal / total }} />
        ))}
      </div>
      <div className="split__legend">
        {parts.map((p) => (
          <div key={p.k} className="split__item">
            <i className={`dot dot--${p.k}`} />
            <span className="split__label">{p.label}</span>
            <b>{fmtK(p.g)} g</b>
            <small>{Math.round((p.kcal / total) * 100)} %</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlanSummary({ profile, weight, calc: given }: { profile: Profile; weight: number; calc?: Calculation }) {
  const c = given ?? calculate(profile, weight);
  const p = c.plan;
  return (
    <div className="plan">
      <div className="plan__hero">
        <span className="plan__kcal">{fmtK(p.kcal)}</span>
        <span className="plan__unit">kcal al día</span>
      </div>
      <MacroSplit protein={p.protein} carbs={p.carbs} fat={p.fat} />
      <div className="group plan__rows">
        <div className="group__row">
          <span>Metabolismo basal</span>
          <span className="group__value">{fmtK(c.bmr)} kcal</span>
        </div>
        <div className="group__row">
          <span>× Actividad ({ACTIVITY[profile.activity].label.toLowerCase()})</span>
          <span className="group__value">× {fmtKg(c.activityFactor)}</span>
        </div>
        <div className="group__row">
          <span>+ Entrenamiento ({profile.trainingDays} días/sem)</span>
          <span className="group__value">+{fmtK(c.training)} kcal</span>
        </div>
        <div className="group__row">
          <span>
            <b>Mantenimiento estimado</b>
          </span>
          <span className="group__value plan__strong">{fmtK(c.tdee)} kcal</span>
        </div>
        <div className="group__row">
          <span>{c.rateDelta >= 0 ? 'Superávit' : 'Déficit'} ({fmtKg(profile.ratePct)} %/sem)</span>
          <span className="group__value">
            {c.rateDelta >= 0 ? '+' : '−'}
            {fmtK(Math.abs(c.rateDelta))} kcal
          </span>
        </div>
      </div>
      <div className="group plan__rows">
        <div className="group__row">
          <span>Proteína</span>
          <span className="group__value plan__rule">{p.explain.proteinRule}</span>
        </div>
        <div className="group__row">
          <span>Grasa</span>
          <span className="group__value plan__rule">{p.explain.fatRule}</span>
        </div>
        <div className="group__row">
          <span>Hidratos</span>
          <span className="group__value plan__rule">el resto de calorías</span>
        </div>
        <div className="group__row">
          <span>Fibra · Agua</span>
          <span className="group__value plan__rule">
            {p.fiber} g · {fmtKg(p.waterMl / 1000)} L
          </span>
        </div>
      </div>
      <p className="hint plan__note">
        Basal: {c.bmrFormula}. Es una estimación inicial: con 2–3 semanas de registros la app calcula tu mantenimiento real y te
        propone ajustes. Es una referencia, no un consejo médico.
      </p>
    </div>
  );
}
