import { useState } from 'react';
import { Check, Flame, Pencil } from 'lucide-react';
import { Page } from '../../ui/Page';
import { Cat } from './Cat';
import { HealthBar } from './HealthBar';
import { updatePet, usePet } from './usePet';
import { catSays, isNight } from './talk';
import { GOOD_DAY, MAX_REST, MAX_TRAIN, MOOD_LABEL, STAGES, type PartKey } from '../../lib/pet';
import { EvolutionSheet } from './EvolutionSheet';
import { useNav } from '../../nav/nav';
import { PromptSheet } from '../../ui/PromptSheet';
import { addDays, dayLabel, fmtK, fmtKg, isoDate } from '../../lib/format';

/** Apartado propio de la mascota (raíz del modo Michi). */
export function CatPage() {
  const v = usePet();
  const [petting, setPetting] = useState(false);
  const [count, setCount] = useState(0);
  const [renaming, setRenaming] = useState(false);
  if (!v) return <Page title="Michi" large />;
  const { state, pet, today } = v;
  const { input, result, targets } = today;
  const next = STAGES[state.stage + 1];
  const today_ = isoDate();
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(today_, i - 14));

  const pet_ = () => {
    setCount((c) => c + 1);
    setPetting(true);
    setTimeout(() => setPetting(false), 1600);
  };

  const { parts, max } = result;
  const item = (k: PartKey, label: string, detail: string) => ({ key: k, label, got: parts[k], max: max[k], detail });
  const nutrition = [
    item('kcal', 'Calorías', `${fmtK(input.kcal)} de ${fmtK(targets.kcal)} kcal (±10 %)`),
    item('protein', 'Proteína', `${fmtK(input.protein)} de ${targets.protein} g (mín. 90 %)`),
    item('water', 'Agua', `${fmtKg(Math.round(input.waterMl / 100) / 10)} de ${fmtKg(targets.waterMl / 1000)} L`),
    item('supps', 'Suplementos', input.suppsTotal ? `${input.suppsTaken} de ${input.suppsTotal}` : 'Sin suplementos activos'),
    item('weight', 'Peso', input.weighed ? 'Registrado' : 'Sin registrar'),
  ];
  const activity = [
    ...(result.training
      ? [item('gym', 'Sesión de gym', today.gym === 'done' ? 'Completada' : 'Toca entrenar hoy')]
      : []),
    item('steps', 'Pasos', `${fmtK(input.steps)} de ${fmtK(today.stepsGoal)} (se apuntan en Gym › Hoy)`),
  ];
  const sum = (xs: { max: number }[]) => xs.reduce((a, x) => a + x.max, 0);
  const goMode = useNav.getState().setMode;

  return (
    <Page
      title={pet.name}
      large
      right={
        <button className="icon-btn" onClick={() => setRenaming(true)} aria-label="Cambiar nombre">
          <Pencil size={20} />
        </button>
      }
    >
      <div className="catpage__hero">
        <div className="catpage__bubble">{catSays(v, petting, count)}</div>
        <button className="catpage__cat" onClick={pet_} aria-label={`Acariciar a ${pet.name}`}>
          <Cat
            mood={state.mood}
            health={state.health}
            stage={state.stage}
            sleeping={isNight() && !petting}
            petting={petting}
            bowlFull={input.kcal >= targets.kcal * 0.5}
            size={260}
          />
        </button>
        <p className="hint" style={{ textAlign: 'center', marginTop: 0 }}>
          Tócalo para acariciarlo
        </p>
      </div>

      <div className="catstats">
        <div className="catstats__row">
          <span>
            Salud · <b className={`mood--${state.mood}`}>{MOOD_LABEL[state.mood]}</b>
          </span>
          <b>{Math.round(state.health)} %</b>
        </div>
        <HealthBar health={state.health} />
        <div className="catstats__grid">
          <div>
            <span>Etapa</span>
            <b>{STAGES[state.stage].name}</b>
          </div>
          <div>
            <span>Días cumplidos</span>
            <b>{state.goodDays}</b>
          </div>
          <div>
            <span>Racha</span>
            <b>
              <Flame size={14} /> {state.streak}
            </b>
          </div>
        </div>
        {next && (
          <p className="hint" style={{ marginTop: 10 }}>
            {next.from - state.goodDays === 1 ? 'Falta 1 día cumplido' : `Faltan ${next.from - state.goodDays} días cumplidos`} para que evolucione a{' '}
            {next.name.toLowerCase()}.
          </p>
        )}
      </div>

      <div className="group-title">
        Hoy · {result.score}/100 · {result.training ? 'día de entreno' : 'día de descanso'}
      </div>
      {[
        { title: 'Nutrición', got: result.nutrition, list: nutrition, mode: 'nutri' as const },
        { title: result.training ? 'Entreno' : 'Actividad', got: result.activity, list: activity, mode: 'gym' as const },
      ].map((sec) => (
        <div key={sec.title} className="group catsec">
          <button className="group__row catsec__head" onClick={() => goMode(sec.mode)}>
            <b>{sec.title}</b>
            <span className="group__value">
              {sec.got}/{sum(sec.list)}
            </span>
          </button>
          {sec.list.map((it) => (
            <div key={it.key} className="group__row cat-item">
              <span className={`cat-item__check ${it.got === it.max ? 'is-on' : it.got > 0 ? 'is-half' : ''}`}>
                {it.got === it.max && <Check size={14} strokeWidth={3} />}
              </span>
              <span className="cat-item__text">
                {it.label}
                <small className="muted">{it.detail}</small>
              </span>
              <span className="group__value">
                {it.got}/{it.max}
              </span>
            </div>
          ))}
        </div>
      ))}
      <p className="hint group-hint">
        Un día cuenta como cumplido con {GOOD_DAY} puntos o más. La puntuación de hoy se cierra a medianoche.
      </p>

      <div className="group-title">Últimos 14 días</div>
      <div className="catdays">
        {last14.map((d) => {
          const before = d < pet.startDate;
          const sc = pet.scores[d];
          const tone = before ? 'none' : sc == null ? 'none' : sc >= GOOD_DAY ? 'good' : sc >= 40 ? 'mid' : 'bad';
          return (
            <div key={d} className="catday" title={`${dayLabel(d)}: ${before ? 'antes de adoptarlo' : `${sc ?? 0} puntos`}`}>
              <span className={`catday__dot catday__dot--${tone}`}>{!before && sc != null ? sc : ''}</span>
              <small>{new Date(d + 'T12:00:00').getDate()}</small>
            </div>
          );
        })}
      </div>

      <div className="group-title">Cómo funciona</div>
      <div className="group steps">
        <div className="group__row">
          Cada día suma hasta 100 puntos. Los días de gym: nutrición {nutMax(MAX_TRAIN)} + sesión hecha {MAX_TRAIN.gym} + pasos {MAX_TRAIN.steps}. Los
          días de descanso: nutrición {nutMax(MAX_REST)} + pasos {MAX_REST.steps}.
        </div>
        <div className="group__row">
          Nutrición: calorías a ±10 % del objetivo, proteína al 90 %, agua, suplementos y pesarte. Pasos: proporcional a tu objetivo diario.
        </div>
        <div className="group__row">Los días buenos le suben la salud; los malos o sin registrar, se la bajan. Si dejas de cuidarlo, enferma y se desnutre.</div>
        <div className="group__row">Con días cumplidos crece: cachorro → joven (7) → adulto (21) → leyenda (60).</div>
        <div className="group__row">Si te saltas una sesión de gym, pierde esos {MAX_TRAIN.gym} puntos y se pone triste.</div>
        <div className="group__row">Nunca muere: unos cuantos días buenos seguidos lo recuperan.</div>
      </div>

      <EvolutionSheet view={v} />
      <PromptSheet
        open={renaming}
        title="Nombre del gato"
        initial={pet.name}
        onClose={() => setRenaming(false)}
        onSubmit={(name) => void updatePet({ name: name.slice(0, 20) })}
      />
    </Page>
  );
}

const nutMax = (m: Record<PartKey, number>) => m.kcal + m.protein + m.water + m.supps + m.weight;
