import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { NotebookPen } from 'lucide-react';
import { db } from '../../db/db';
import { useGym } from '../store';
import { fmtDateShort } from '../../lib/format';

export interface PastNote {
  date: number;
  week: number;
  note: string;
}

/** Notas de sesiones anteriores del mismo ejercicio (por nombre: así las laterales del lunes y del viernes comparten notas). */
export function usePastNotes(name: string, currentId: string, limit = 3): PastNote[] {
  return useLiveQuery(
    async () => {
      const all = await db.gymSessions.toArray();
      return all
        .filter((s) => s.id !== currentId && s.status === 'done')
        .flatMap((s) => s.exercises.filter((e) => e.name === name && e.note?.trim()).map((e) => ({ date: s.startedAt, week: s.week, note: e.note!.trim() })))
        .sort((a, b) => b.date - a.date)
        .slice(0, limit);
    },
    [name, currentId],
    [],
  );
}

export function PastNotes({ name, currentId }: { name: string; currentId: string }) {
  const notes = usePastNotes(name, currentId);
  if (!notes.length) return null;
  return (
    <div className="pnotes">
      <span className="pnotes__k">
        <NotebookPen size={14} /> Tus notas anteriores
      </span>
      {notes.map((n, i) => (
        <p key={i}>
          <small>
            {fmtDateShort(n.date)} · sem. {n.week}
          </small>
          {n.note}
        </p>
      ))}
    </div>
  );
}

/** Recuadro para escribir notas del ejercicio durante el descanso; se guardan solas. */
export function NoteBox({ exIndex }: { exIndex: number }) {
  const session = useGym((x) => x.session);
  const e = session?.exercises[exIndex];
  const [text, setText] = useState(e?.note ?? '');
  useEffect(() => setText(e?.note ?? ''), [exIndex, session?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!e) return null;
  const save = (v: string) => {
    setText(v);
    useGym.getState().mutate((x) => {
      x.exercises[exIndex].note = v;
    });
  };
  return (
    <label className="notebox">
      <span className="notebox__k">
        <NotebookPen size={14} /> Notas de {e.name}
      </span>
      <textarea
        value={text}
        rows={3}
        placeholder="Técnica, sensaciones, ajustes de la máquina, agarre… Las verás la próxima vez."
        onChange={(ev) => save(ev.target.value)}
      />
    </label>
  );
}
