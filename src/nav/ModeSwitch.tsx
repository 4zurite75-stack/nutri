import { Apple, Cat, Dumbbell } from 'lucide-react';
import { useNav, type Mode } from './nav';

const MODES: { id: Mode; label: string; icon: typeof Apple }[] = [
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'michi', label: 'Michi', icon: Cat },
  { id: 'nutri', label: 'Nutrición', icon: Apple },
];

/** Selector principal de apartado: Gym, Michi o Nutrición. */
export function ModeSwitch() {
  const mode = useNav((s) => s.mode);
  const setMode = useNav((s) => s.setMode);
  return (
    <div className={`modesw modesw--${mode}`} role="tablist" aria-label="Apartado">
      <span className="modesw__thumb" />
      {MODES.map(({ id, label, icon: Icon }) => (
        <button key={id} role="tab" aria-selected={mode === id} className={mode === id ? 'is-active' : ''} onClick={() => setMode(id)}>
          <Icon size={15} strokeWidth={2.4} /> {label}
        </button>
      ))}
    </div>
  );
}
