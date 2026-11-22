import { useState } from 'react';
import { ChevronLeft, Leaf } from 'lucide-react';
import { db } from '../../db/db';
import { setSetting } from '../../state/settings';
import { calculate, targetsFrom } from '../../lib/nutrition';
import { isoDate } from '../../lib/format';
import { parseNum } from '../../ui/fields';
import { toast } from '../../ui/uiStore';
import { uid } from '../../lib/id';
import { ActivityFields, BodyFields, GoalFields, draftFrom, draftValid, profileFrom, useDraft } from './ProfileForm';
import { PlanSummary } from './PlanSummary';
import { Chip } from '../../ui/controls';

const SUPPS = [
  { name: 'Creatina monohidrato', dose: 5, unit: 'g' },
  { name: 'Vitamina D3', dose: 2000, unit: 'UI' },
  { name: 'Omega-3', dose: 1, unit: 'g' },
  { name: 'Magnesio', dose: 300, unit: 'mg' },
  { name: 'Multivitamínico', dose: 1, unit: 'cápsula' },
  { name: 'Cafeína', dose: 200, unit: 'mg' },
];

const STEPS = ['Bienvenida', 'Tus datos', 'Actividad', 'Objetivo', 'Suplementos', 'Tu plan'];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [d, set] = useDraft(draftFrom(null));
  const [supps, setSupps] = useState<string[]>([]);
  const error = step === 1 ? draftValid(d) : null;
  const weight = parseNum(d.weight) ?? 70;
  const profile = profileFrom(d, null);

  const finish = async () => {
    const calc = calculate(profile, weight);
    await setSetting('profile', profile);
    await setSetting('targets', targetsFrom(calc, 'calculado'));
    await db.weights.put({ date: isoDate(), kg: weight, createdAt: Date.now() });
    await db.supplements.bulkPut(
      SUPPS.filter((s) => supps.includes(s.name)).map((s, i) => ({ id: uid(), name: s.name, dose: s.dose, unit: s.unit, active: true, order: i })),
    );
    toast('¡Plan listo!', { tone: 'success' });
  };

  return (
    <div className="onb">
      <header className="onb__head">
        {step > 0 ? (
          <button className="navbar__back" onClick={() => setStep(step - 1)}>
            <ChevronLeft size={28} strokeWidth={2.4} />
            <span>Atrás</span>
          </button>
        ) : (
          <span />
        )}
        <div className="onb__dots">
          {STEPS.map((_, i) => (
            <i key={i} className={i <= step ? 'is-on' : ''} />
          ))}
        </div>
        <span />
      </header>
      <div className="onb__body" key={step}>
        {step === 0 && (
          <div className="onb__welcome">
            <div className="onb__logo">
              <Leaf size={44} />
            </div>
            <h1>Nutri</h1>
            <p>
              Calcula tus calorías y macros según tu objetivo, registra lo que comes escaneando el código de barras y ajusta el plan
              con tu progreso real.
            </p>
            <ul className="onb__list">
              <li>Tus datos se guardan solo en este móvil.</li>
              <li>Si sois dos, cada uno instala la app en su teléfono con su propio perfil.</li>
            </ul>
          </div>
        )}
        {step === 1 && (
          <>
            <h2 className="onb__title">Tus datos</h2>
            <BodyFields d={d} set={set} />
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="onb__title">Tu actividad</h2>
            <ActivityFields d={d} set={set} />
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="onb__title">Tu objetivo</h2>
            <GoalFields d={d} set={set} />
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="onb__title">Suplementos</h2>
            <div className="form">
              <p className="muted">Marca los que tomas para tenerlos en tu lista diaria. Podrás cambiar dosis y añadir otros.</p>
              <div className="chips-wrap">
                {SUPPS.map((s) => (
                  <Chip
                    key={s.name}
                    active={supps.includes(s.name)}
                    onClick={() => setSupps((l) => (l.includes(s.name) ? l.filter((x) => x !== s.name) : [...l, s.name]))}
                  >
                    {s.name} · {s.dose} {s.unit}
                  </Chip>
                ))}
              </div>
              <p className="hint">Creatina: la dosis estudiada es de 3–5 g al día, todos los días, a cualquier hora.</p>
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <h2 className="onb__title">{d.name ? `${d.name.split(' ')[0]}, este es tu plan` : 'Tu plan'}</h2>
            <PlanSummary profile={profile} weight={weight} />
          </>
        )}
      </div>
      <footer className="onb__foot">
        {error && <p className="onb__error">{error}</p>}
        <button
          className="btn btn--primary btn--block btn--lg"
          disabled={!!error}
          onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : void finish())}
        >
          {step === 0 ? 'Empezar' : step === STEPS.length - 1 ? 'Empezar a registrar' : 'Continuar'}
        </button>
      </footer>
    </div>
  );
}
