import { useState } from 'react';
import { ChevronRight, Flame } from 'lucide-react';
import { Cat } from './Cat';
import { usePet } from './usePet';
import { catSays, isNight } from './talk';
import { MOOD_LABEL, STAGES } from '../../lib/pet';
import { push } from '../../nav/nav';
import { CatPage } from './CatPage';
import { EvolutionSheet } from './EvolutionSheet';

export function HealthBar({ health }: { health: number }) {
  const tone = health >= 60 ? 'good' : health >= 40 ? 'mid' : 'bad';
  return (
    <div className="hbar">
      <span className={`hbar__fill hbar__fill--${tone}`} style={{ transform: `scaleX(${Math.max(0.03, health / 100)})` }} />
    </div>
  );
}

export function CatCard() {
  const v = usePet();
  const [petting, setPetting] = useState(false);
  const [count, setCount] = useState(0);
  if (!v) return null;
  const { state, pet, today } = v;
  const sleeping = isNight() && !petting;

  const pet_ = () => {
    setCount((c) => c + 1);
    setPetting(true);
    setTimeout(() => setPetting(false), 1600);
  };

  return (
    <section className="card catcard">
      <button className="catcard__pet" onClick={pet_} aria-label={`Acariciar a ${pet.name}`}>
        <Cat
          mood={state.mood}
          health={state.health}
          stage={state.stage}
          sleeping={sleeping}
          petting={petting}
          bowlFull={today.input.kcal >= today.targets.kcal * 0.5}
          size={window.innerWidth < 380 ? 100 : 132}
        />
      </button>
      <button className="catcard__info" onClick={() => push(() => <CatPage />)}>
        <span className="catcard__top">
          <b>{pet.name}</b>
          <span className={`catcard__mood mood--${state.mood}`}>{MOOD_LABEL[state.mood]}</span>
          <ChevronRight size={16} className="muted" />
        </span>
        <span className="catcard__bubble">{catSays(v, petting, count)}</span>
        <HealthBar health={state.health} />
        <span className="catcard__meta">
          {STAGES[state.stage].name} · hoy {today.result.score}/100
          {state.streak > 1 && (
            <>
              {' · '}
              <Flame size={12} /> {state.streak}
            </>
          )}
        </span>
      </button>
      <EvolutionSheet view={v} />
    </section>
  );
}
