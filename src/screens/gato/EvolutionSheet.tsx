import { Sheet } from '../../ui/Sheet';
import { Cat } from './Cat';
import { STAGES } from '../../lib/pet';
import { updatePet, type PetView } from './usePet';

/** Celebración cuando el gato sube de etapa. */
export function EvolutionSheet({ view }: { view: PetView }) {
  const { state, pet } = view;
  const open = state.stage > pet.lastStage;
  return (
    <Sheet open={open} onClose={() => void updatePet({ lastStage: state.stage })}>
      <div className="evo">
        <div className="evo__glow">
          <Cat mood={state.mood} health={state.health} stage={state.stage} petting size={200} />
        </div>
        <h2>¡{pet.name} ha evolucionado!</h2>
        <p className="muted">
          Ahora es <b>{STAGES[state.stage].name.toLowerCase()}</b> gracias a tus {state.goodDays} días cumplidos.
          {state.stage === 2 && ' Se ha ganado su collar.'}
          {state.stage === 3 && ' Lleva corona: pocos llegan hasta aquí.'}
        </p>
        <button className="btn btn--primary btn--block btn--lg" onClick={() => void updatePet({ lastStage: state.stage })}>
          ¡Genial!
        </button>
      </div>
    </Sheet>
  );
}
