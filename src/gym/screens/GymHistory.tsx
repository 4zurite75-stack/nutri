import { useLiveQuery } from 'dexie-react-hooks';
import { Clock3, Dumbbell, Trash2, Trophy } from 'lucide-react';
import { Page } from '../../ui/Page';
import { Empty } from '../../ui/controls';
import { db } from '../../db/db';
import { useGymSessions } from '../store';
import { DAY, weekInfo, fmtLoad } from '../program';
import { fmtDateLong, fmtTime, relativeDay } from '../../lib/format';
import { push, pop } from '../../nav/nav';
import { useSettings } from '../../state/settings';
import { ResultsList, sessionResults } from './SessionResults';
import { confirm, toast } from '../../ui/uiStore';
import type { GymSession } from '../types';
import { setLabel } from '../runner/labels';

const mins = (s: GymSession) => Math.round(((s.endedAt ?? s.startedAt) - s.startedAt) / 60000);
const highlight = (s: GymSession) => {
  for (const e of s.exercises) {
    const a = e.sets.find((x) => x.kind === 'amrap' && x.done);
    if (a) return `AMRAP ${e.name.split(' ')[0].toLowerCase()} ${a.reps} reps`;
    const t = e.sets.find((x) => x.kind === 'top' && x.done);
    if (t) return 'Calibración de 1RM';
  }
  return null;
};

export function GymHistory() {
  const sessions = (useGymSessions() ?? []).filter((s) => s.status === 'done').sort((a, b) => b.startedAt - a.startedAt);
  return (
    <Page title="Historial" large>
      {sessions.length === 0 && <Empty icon={<Clock3 size={30} />} title="Aún no hay sesiones" text="Cuando termines tu primera sesión aparecerá aquí." />}
      <div className="hist-week" style={{ paddingTop: 4 }}>
        {sessions.map((s) => {
          const done = s.exercises.flatMap((e) => e.sets).filter((x) => x.done).length;
          const h = highlight(s);
          return (
            <button key={s.id} className="hist-card" onClick={() => push(() => <SessionDetail id={s.id} />)}>
              <div className="hist-card__top">
                <span className="hist-card__name">{DAY(s.dayId).name}</span>
                {h && (
                  <span className="pr-badge">
                    <Trophy size={12} /> {h}
                  </span>
                )}
              </div>
              <div className="hist-card__date">
                {relativeDay(s.startedAt)} · {fmtTime(s.startedAt)} · Semana {s.week} · {weekInfo(s.week).label}
              </div>
              <div className="hist-card__stats">
                <span>
                  <Clock3 size={14} /> {mins(s)} min
                </span>
                <span>
                  <Dumbbell size={14} /> {done} series
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Page>
  );
}

export function SessionDetail({ id }: { id: string }) {
  const s = useLiveQuery(() => db.gymSessions.get(id), [id]);
  const all = useGymSessions() ?? [];
  const cfg = useSettings().program;
  if (!s || !cfg) return <Page title="" back />;
  const rows = sessionResults(s, all, cfg);
  return (
    <Page title={DAY(s.dayId).name} back>
      <div className="wd-head">
        <h2>{DAY(s.dayId).name}</h2>
        <p className="muted">
          {fmtDateLong(s.startedAt)} · {mins(s)} min · Semana {s.week} · {weekInfo(s.week).label}
        </p>
      </div>
      {rows.length > 0 && (
        <>
          <div className="group-title">Resultados</div>
          <ResultsList rows={rows} />
        </>
      )}
      {s.exercises.map((e) => (
        <div key={e.exId} className="wd-ex">
          <div className="wd-ex__head">
            <span className="wd-ex__name">{e.name}</span>
          </div>
          <div className="wd-sets">
            {e.sets.map((x, i) => (
              <div key={x.id} className={`wd-set ${x.done ? '' : 'is-off'}`}>
                <span className="wd-set__lab">{setLabel(e, i)}</span>
                <span className="wd-set__main">
                  {x.done ? `${fmtLoad(x.weight, e.bodyweight) || '—'} × ${x.reps ?? '—'}` : x.skipped ? 'Saltada' : 'No hecha'}
                  {x.rir != null && <span className="muted"> @ RIR {x.rir}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        className="btn btn--danger-plain"
        onClick={async () => {
          if (!(await confirm({ title: '¿Eliminar esta sesión?', message: 'Los cálculos de progresión que dependan de ella se recalcularán.', confirmText: 'Eliminar', destructive: true }))) return;
          pop();
          await db.gymSessions.delete(id);
          toast('Sesión eliminada');
        }}
      >
        <Trash2 size={18} /> Eliminar sesión
      </button>
    </Page>
  );
}
