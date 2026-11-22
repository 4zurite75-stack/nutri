import { useEffect, useState } from 'react';
import { Page } from '../../ui/Page';
import { setSetting, useSettings } from '../../state/settings';
import { NumField, parseNum } from '../../ui/fields';
import { fmtK, fmtKg } from '../../lib/format';
import { toast } from '../../ui/uiStore';
import { MacroSplit } from '../onboarding/PlanSummary';

const SOURCE = { calculado: 'Calculado con tu perfil', adaptativo: 'Ajustado con tu progreso real', manual: 'Puesto a mano' };

export function TargetsPage() {
  const s = useSettings();
  const t = s.targets;
  const [v, setV] = useState({ kcal: '', protein: '', carbs: '', fat: '', water: '' });
  useEffect(() => {
    if (t) setV({ kcal: String(t.kcal), protein: String(t.protein), carbs: String(t.carbs), fat: String(t.fat), water: fmtKg(t.waterMl / 1000) });
  }, [t]);
  if (!t) return <Page title="Objetivos" back />;
  const p = parseNum(v.protein) ?? 0;
  const c = parseNum(v.carbs) ?? 0;
  const f = parseNum(v.fat) ?? 0;
  const fromMacros = p * 4 + c * 4 + f * 9;

  const save = async () => {
    const kcal = Math.round(fromMacros);
    if (kcal < 800) return toast('Revisa los valores');
    await setSetting('targets', {
      ...t,
      kcal,
      protein: Math.round(p),
      carbs: Math.round(c),
      fat: Math.round(f),
      waterMl: Math.round((parseNum(v.water) ?? 2.5) * 1000),
      source: 'manual',
      setAt: Date.now(),
    });
    toast('Objetivos guardados', { tone: 'success' });
  };

  return (
    <Page
      title="Objetivos diarios"
      back="Ajustes"
      right={
        <button className="link-btn is-bold" onClick={() => void save()}>
          Guardar
        </button>
      }
    >
      <div className="plan__hero" style={{ paddingTop: 8 }}>
        <span className="plan__kcal">{fmtK(fromMacros)}</span>
        <span className="plan__unit">kcal al día</span>
      </div>
      <div className="section">
        <MacroSplit protein={p} carbs={c} fat={f} />
      </div>
      <div className="form" style={{ marginTop: 16 }}>
        <div className="numfield-grid">
          <NumField label="Proteína" value={v.protein} unit="g" decimal={false} onChange={(x) => setV({ ...v, protein: x })} />
          <NumField label="Hidratos" value={v.carbs} unit="g" decimal={false} onChange={(x) => setV({ ...v, carbs: x })} />
          <NumField label="Grasa" value={v.fat} unit="g" decimal={false} onChange={(x) => setV({ ...v, fat: x })} />
          <NumField label="Agua" value={v.water} unit="L" onChange={(x) => setV({ ...v, water: x })} />
        </div>
      </div>
      <p className="hint group-hint">
        Las calorías salen de los macros (4 kcal/g proteína e hidratos, 9 kcal/g grasa). Origen actual: {SOURCE[t.source]}. Mantenimiento de
        referencia: {fmtK(t.tdee)} kcal. Si los cambias a mano, las revisiones semanales seguirán proponiendo ajustes.
      </p>
    </Page>
  );
}
