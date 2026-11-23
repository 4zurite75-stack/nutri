import { Check, SkipForward } from 'lucide-react';
import { Sheet, SheetHeader } from '../../ui/Sheet';
import type { GymSession } from '../types';
import { useGym } from '../store';
import { useSettings } from '../../state/settings';
import { setLabel, loadText, repsText } from './labels';
import { fmtLoad } from '../program';

export function OverviewSheet({ open, session, onClose, onDiscard }: { open: boolean; session: GymSession; onClose: () => void; onDiscard: () => void }) {
  const cfg = useSettings().program;
  if (!cfg) return null;
  const go = (ex: number, set: number) => {
    useGym.getState().mutate((x) => {
      x.cursor = { ex, set };
      x.rest = null;
      x.exercises[ex].sets[set].skipped = false;
    });
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} size="full">
      <SheetHeader
        title="Toda la sesión"
        right={
          <button className="link-btn is-bold" onClick={onClose}>
            Cerrar
          </button>
        }
      />
      <div className="sheet-scroll ov">
        {session.exercises.map((e, ei) => (
          <section key={e.exId} className="ov__ex">
            <h3>
              {ei + 1}. {e.name}
            </h3>
            <p className="ov__what">{e.instructions}</p>
            {e.sets.map((s, si) => {
              const current = session.cursor.ex === ei && session.cursor.set === si;
              return (
                <button key={s.id} className={`ov__set ${s.done ? 'is-done' : s.skipped ? 'is-skipped' : ''} ${current ? 'is-current' : ''}`} onClick={() => go(ei, si)}>
                  <span className="ov__mark">{s.done ? <Check size={14} strokeWidth={3} /> : s.skipped ? <SkipForward size={13} /> : ''}</span>
                  <span className="ov__label">{setLabel(e, si)}</span>
                  <span className="ov__val">
                    {s.done ? `${fmtLoad(s.weight, e.bodyweight) || '—'} × ${s.reps ?? '—'}${s.rir != null ? ` @${s.rir}` : ''}` : `${loadText(e, s, cfg)} × ${repsText(e, s)}`}
                  </span>
                </button>
              );
            })}
          </section>
        ))}
        <p className="hint" style={{ padding: '0 var(--gutter)' }}>
          Toca cualquier serie para ir a ella (también para corregir una ya hecha).
        </p>
        <button className="btn btn--danger-plain" onClick={onDiscard}>
          Descartar sesión
        </button>
      </div>
    </Sheet>
  );
}
