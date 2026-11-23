import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2 } from 'lucide-react';
import type { GymSession } from '../types';
import { useGym } from '../store';
import { db } from '../../db/db';
import { useSettings } from '../../state/settings';
import { ResultsList, sessionResults } from '../screens/SessionResults';
import { toast } from '../../ui/uiStore';
import { progress } from './cursor';

export function FinishView({ session }: { session: GymSession }) {
  const s = useSettings();
  const all = useLiveQuery(() => db.gymSessions.toArray(), [], [] as GymSession[]);
  const p = progress(session);
  const skipped = session.exercises.flatMap((e) => e.sets).filter((x) => x.skipped).length;
  const rows = s.program ? sessionResults(session, all, s.program) : [];
  const mins = Math.round((Date.now() - session.startedAt) / 60000);
  return (
    <div className="rfinish">
      <div className="rfinish__hero">
        <CheckCircle2 size={56} />
        <h2>¡Sesión completada!</h2>
        <p className="muted">
          {mins} min · {p.done - skipped} series hechas{skipped ? ` · ${skipped} saltadas` : ''}
        </p>
      </div>
      {rows.length > 0 && <ResultsList rows={rows} />}
      <div className="form" style={{ marginTop: 16 }}>
        <button
          className="btn btn--primary btn--block btn--lg"
          onClick={async () => {
            await useGym.getState().finish();
            toast('Sesión guardada', { tone: 'success' });
          }}
        >
          Guardar y terminar
        </button>
      </div>
    </div>
  );
}
