import { useLiveQuery } from 'dexie-react-hooks';
import { Page } from '../../ui/Page';
import { useSettings, setSetting } from '../../state/settings';
import { ActivityFields, BodyFields, GoalFields, draftFrom, draftValid, profileFrom, useDraft } from '../onboarding/ProfileForm';
import { PlanSummary } from '../onboarding/PlanSummary';
import { calculate, targetsFrom } from '../../lib/nutrition';
import { parseNum } from '../../ui/fields';
import { db } from '../../db/db';
import { weightTrend } from '../../lib/adaptive';
import { pop } from '../../nav/nav';
import { toast } from '../../ui/uiStore';
import { isoDate } from '../../lib/format';
import { Segmented } from '../../ui/controls';
import { useState } from 'react';

function Editor({ initialWeight }: { initialWeight?: number }) {
  const s = useSettings();
  const [d, set] = useDraft(draftFrom(s.profile, initialWeight));
  const [section, setSection] = useState<'datos' | 'actividad' | 'objetivo'>('datos');
  const error = draftValid(d);
  const weight = parseNum(d.weight) ?? 70;
  const profile = profileFrom(d, s.profile);
  // Si la app ya aprendió tu mantenimiento real, se conserva al cambiar el objetivo.
  const learned = s.targets?.source === 'adaptativo' ? s.targets.tdee : undefined;
  const calc = calculate(profile, weight, learned);

  const save = async () => {
    if (error) return toast(error);
    await setSetting('profile', profile);
    await setSetting('targets', targetsFrom(calc, learned ? 'adaptativo' : 'calculado'));
    if (initialWeight == null || Math.abs(weight - initialWeight) > 0.05) await db.weights.put({ date: isoDate(), kg: weight, createdAt: Date.now() });
    toast('Perfil y objetivos actualizados', { tone: 'success' });
    pop();
  };

  return (
    <Page
      title="Perfil y objetivo"
      back="Ajustes"
      right={
        <button className="link-btn is-bold" disabled={!!error} onClick={() => void save()}>
          Guardar
        </button>
      }
    >
      <div className="section" style={{ paddingTop: 8 }}>
        <Segmented
          value={section}
          onChange={setSection}
          options={[
            { value: 'datos', label: 'Datos' },
            { value: 'actividad', label: 'Actividad' },
            { value: 'objetivo', label: 'Objetivo' },
          ]}
        />
      </div>
      {section === 'datos' && <BodyFields d={d} set={set} />}
      {section === 'actividad' && <ActivityFields d={d} set={set} />}
      {section === 'objetivo' && <GoalFields d={d} set={set} />}
      {error && <p className="onb__error">{error}</p>}
      <div className="group-title">Resultado</div>
      {!error && <PlanSummary profile={profile} weight={weight} calc={calc} />}
      {learned && <p className="hint group-hint">Se usa tu mantenimiento real medido ({learned} kcal) en lugar de la fórmula.</p>}
    </Page>
  );
}

export function ProfilePage() {
  const weights = useLiveQuery(() => db.weights.toArray(), []);
  if (!weights) return <Page title="Perfil y objetivo" back />;
  const t = weightTrend(weights);
  const w = t.length ? Math.round(t[t.length - 1].trend * 10) / 10 : undefined;
  return <Editor initialWeight={w} />;
}
