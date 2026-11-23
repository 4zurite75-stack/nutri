import { Apple, Dumbbell } from 'lucide-react';
import { useNav } from './nav';

/** Selector principal de apartado: Gym o Nutrición. */
export function ModeSwitch() {
  const mode = useNav((s) => s.mode);
  const setMode = useNav((s) => s.setMode);
  return (
    <div className={`modesw modesw--${mode}`} role="tablist" aria-label="Apartado">
      <span className="modesw__thumb" />
      <button role="tab" aria-selected={mode === 'gym'} className={mode === 'gym' ? 'is-active' : ''} onClick={() => setMode('gym')}>
        <Dumbbell size={16} strokeWidth={2.4} /> Gym
      </button>
      <button role="tab" aria-selected={mode === 'nutri'} className={mode === 'nutri' ? 'is-active' : ''} onClick={() => setMode('nutri')}>
        <Apple size={16} strokeWidth={2.4} /> Nutrición
      </button>
    </div>
  );
}
