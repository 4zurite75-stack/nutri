import { useState } from 'react';
import { Check, Flame, Pencil } from 'lucide-react';
import { Page } from '../../ui/Page';
import { Cat } from './Cat';
import { HealthBar } from './CatCard';
import { updatePet, usePet } from './usePet';
import { catSays, isNight } from './talk';
import { GOOD_DAY, GYM_BONUS, MAX, MOOD_LABEL, STAGES } from '../../lib/pet';
import { PromptSheet } from '../../ui/PromptSheet';
import { addDays, dayLabel, fmtK, fmtKg, isoDate } from '../../lib/format';

export function CatPage() {
  const v = usePet();
  const [petting, setPetting] = useState(false);
  const [count, setCount] = useState(0);
  const [renaming, setRenaming] = useState(false);
  if (!v) return <Page title="Tu gato" back />;
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

  const items = [
    {
      label: 'Calorías',
      got: result.parts.kcal,
      max: MAX.kcal,
      detail: `${fmtK(input.kcal)} de ${fmtK(targets.kcal)} kcal (±10 %)`,
    },
    { label: 'Proteína', got: result.parts.protein, max: MAX.protein, detail: `${fmtK(input.protein)} de ${targets.protein} g (mín. 90 %)` },
    {
      label: 'Agua',
      got: result.parts.water,
      max: MAX.water,
      detail: `${fmtKg(Math.round(input.waterMl / 100) / 10)} de ${fmtKg(targets.waterMl / 1000)} L`,
    },
    {
      label: 'Suplementos',
      got: result.parts.supps,
      max: MAX.supps,
      detail: input.suppsTotal ? `${input.suppsTaken} de ${input.suppsTotal}` : 'Sin suplementos activos',
    },
    { label: 'Peso', got: result.parts.weight, max: MAX.weight, detail: input.weighed ? 'Registrado' : 'Sin registrar' },
  ];

  return (
    <Page
      title={pet.name}
      back="Hoy"
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

      <div className="group-title">Hoy · {result.score}/100</div>
      <div className="group">
        {items.map((it) => (
          <div key={it.label} className="group__row cat-item">
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
      {today.gym && (
        <div className="group" style={{ marginTop: 8 }}>
          <div className="group__row cat-item">
            <span className={`cat-item__check ${today.gym === 'done' ? 'is-on' : ''}`}>{today.gym === 'done' && <Check size={14} strokeWidth={3} />}</span>
            <span className="cat-item__text">
              Entreno de hoy
              <small className="muted">{today.gym === 'done' ? 'Sesión completada' : 'Día de gym: complétalo para sumarle salud'}</small>
            </span>
            <span className="group__value">±{GYM_BONUS} salud</span>
          </div>
        </div>
      )}
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
          Cada día suma hasta 100 puntos: calorías a ±10 % del objetivo ({MAX.kcal}), proteína al 90 % ({MAX.protein}), agua ({MAX.water}),
          suplementos ({MAX.supps}) y pesarte ({MAX.weight}).
        </div>
        <div className="group__row">Los días buenos le suben la salud; los malos o sin registrar, se la bajan. Si dejas de cuidarlo, enferma y se desnutre.</div>
        <div className="group__row">Con días cumplidos crece: cachorro → joven (7) → adulto (21) → leyenda (60).</div>
        <div className="group__row">Los días de gym del programa suman {GYM_BONUS} de salud si haces la sesión y restan {GYM_BONUS} si te la saltas.</div>
        <div className="group__row">Nunca muere: unos cuantos días buenos seguidos lo recuperan.</div>
      </div>

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
