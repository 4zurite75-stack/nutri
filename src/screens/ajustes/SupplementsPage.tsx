import { useState } from 'react';
import { BellRing, CalendarPlus, Plus, Share, X } from 'lucide-react';
import { icsFile, openIcs, reminderList } from '../../lib/ics';
import { shareOrDownload } from '../../lib/backup';
import { Page } from '../../ui/Page';
import { useSupplements } from '../../db/hooks';
import { db } from '../../db/db';
import type { Supplement } from '../../db/types';
import { Sheet, SheetHeader } from '../../ui/Sheet';
import { NumField, parseNum } from '../../ui/fields';
import { Toggle } from '../../ui/controls';
import { uid } from '../../lib/id';
import { fmtKg } from '../../lib/format';
import { confirm } from '../../ui/uiStore';

function Editor({ supp, onClose }: { supp: Supplement | null | undefined; onClose: () => void }) {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('g');
  const [time, setTime] = useState('');
  const [reminders, setReminders] = useState<string[]>([]);
  const [key, setKey] = useState<string | null>(null);
  const k = supp === undefined ? null : supp?.id ?? 'new';
  if (k !== key) {
    setKey(k);
    setName(supp?.name ?? '');
    setDose(supp ? fmtKg(supp.dose) : '');
    setUnit(supp?.unit ?? 'g');
    setTime(supp?.time ?? '');
    setReminders(supp?.reminders ?? []);
  }
  const save = async () => {
    const count = await db.supplements.count();
    await db.supplements.put({
      id: supp?.id ?? uid(),
      name: name.trim(),
      dose: parseNum(dose) ?? 0,
      unit: unit.trim() || 'g',
      time: time.trim() || undefined,
      reminders: [...new Set(reminders.filter(Boolean))].sort(),
      active: supp?.active ?? true,
      order: supp?.order ?? count,
    });
    onClose();
  };
  return (
    <Sheet open={supp !== undefined} onClose={onClose}>
      <SheetHeader
        title={supp ? 'Editar suplemento' : 'Nuevo suplemento'}
        left={
          <button className="link-btn" onClick={onClose}>
            Cancelar
          </button>
        }
        right={
          <button className="link-btn is-bold" disabled={!name.trim() || !parseNum(dose)} onClick={() => void save()}>
            Guardar
          </button>
        }
      />
      <div className="form" style={{ paddingBottom: 24 }}>
        <label className="field">
          <span className="field__label">Nombre</span>
          <input className="input" value={name} placeholder="Creatina monohidrato" onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="numfield-grid">
          <NumField label="Dosis" value={dose} onChange={setDose} />
          <label className="field">
            <span className="field__label">Unidad</span>
            <input className="input" value={unit} placeholder="g, mg, UI, cápsulas" onChange={(e) => setUnit(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span className="field__label">Cuándo (opcional)</span>
          <input className="input" value={time} placeholder="Con el desayuno" onChange={(e) => setTime(e.target.value)} />
        </label>
        <div className="field">
          <span className="field__label">Horas de aviso</span>
          <div className="rtimes">
            {reminders.map((r, i) => (
              <span key={i} className="rtime">
                <input
                  type="time"
                  className="input rtime__input"
                  value={r}
                  onChange={(e) => setReminders(reminders.map((x, j) => (j === i ? e.target.value : x)))}
                />
                <button className="icon-btn" aria-label="Quitar hora" onClick={() => setReminders(reminders.filter((_, j) => j !== i))}>
                  <X size={18} />
                </button>
              </span>
            ))}
            <button
              className="btn btn--tinted rtime__add"
              onClick={() => setReminders([...reminders, reminders.length ? '20:00' : '15:00'])}
            >
              <BellRing size={16} /> Añadir hora
            </button>
          </div>
        </div>
        {supp && (
          <button
            className="btn btn--danger-plain"
            onClick={async () => {
              if (await confirm({ title: `¿Eliminar ${supp.name}?`, confirmText: 'Eliminar', destructive: true })) {
                await db.supplements.delete(supp.id);
                onClose();
              }
            }}
          >
            Eliminar suplemento
          </button>
        )}
      </div>
    </Sheet>
  );
}

export function SupplementsPage() {
  const list = useSupplements() ?? [];
  const [editing, setEditing] = useState<Supplement | null | undefined>(undefined);
  return (
    <Page
      title="Suplementos"
      back="Ajustes"
      right={
        <button className="icon-btn" onClick={() => setEditing(null)} aria-label="Añadir suplemento">
          <Plus size={24} />
        </button>
      }
    >
      <div className="group" style={{ marginTop: 12 }}>
        {list.map((s) => (
          <div key={s.id} className="group__row">
            <button className="supp-edit" onClick={() => setEditing(s)}>
              <span>{s.name}</span>
              <small className="muted">
                {fmtKg(s.dose)} {s.unit}
                {s.time ? ` · ${s.time}` : ''}
                {s.reminders?.length ? ` · 🔔 ${s.reminders.join(', ')}` : ''}
              </small>
            </button>
            <Toggle value={s.active} onChange={(v) => void db.supplements.update(s.id, { active: v })} />
          </div>
        ))}
        {list.length === 0 && (
          <button className="group__row group__row--link" onClick={() => setEditing(null)}>
            <span className="muted">Añade los suplementos que tomas para marcarlos cada día.</span>
          </button>
        )}
      </div>
      <p className="hint group-hint">Los desactivados no aparecen en Hoy, pero se guarda su historial.</p>
      <Reminders list={list} />
      <Editor supp={editing} onClose={() => setEditing(undefined)} />
    </Page>
  );
}

const SIG_KEY = 'fisico-supp-ics';
const sigOf = (list: Supplement[]) =>
  reminderList(list)
    .map((r) => `${r.supp.id}@${r.time}`)
    .join(',');

function Reminders({ list }: { list: Supplement[] }) {
  const items = reminderList(list);
  const sig = sigOf(list);
  const [saved, setSaved] = useState(() => {
    try {
      return localStorage.getItem(SIG_KEY);
    } catch {
      return null;
    }
  });
  const mark = () => {
    try {
      localStorage.setItem(SIG_KEY, sig);
    } catch {
      /* nada */
    }
    setSaved(sig);
  };
  return (
    <>
      <div className="group-title">Avisos en el móvil</div>
      {items.length === 0 ? (
        <p className="hint group-hint" style={{ marginTop: 0 }}>
          Entra en un suplemento y añade las horas a las que quieres que te avise (por ejemplo 15:00 y 20:00).
        </p>
      ) : (
        <>
          <div className="group">
            {items.map((r) => (
              <div key={r.supp.id + r.time} className="group__row">
                <span>
                  <b>{r.time}</b> · {r.supp.name}
                </span>
              </div>
            ))}
          </div>
          {saved != null && saved !== sig && <p className="hint group-hint rem-warn">Has cambiado las horas: vuelve a añadirlos al Calendario (y borra los antiguos).</p>}
          <div className="rem-btns">
            <button
              className="btn btn--primary btn--block"
              onClick={() => {
                openIcs(list);
                mark();
              }}
            >
              <CalendarPlus size={18} /> Añadir al Calendario
            </button>
            <button
              className="btn btn--tinted btn--block"
              onClick={async () => {
                const r = await shareOrDownload(icsFile(list));
                if (r !== 'cancelled') mark();
              }}
            >
              <Share size={18} /> Compartir el archivo
            </button>
          </div>
          <div className="group steps" style={{ marginTop: 12 }}>
            <div className="group__row">1. Pulsa «Añadir al Calendario» y, en la ventana que sale, toca «Añadir todo».</div>
            <div className="group__row">2. Listo: el iPhone te avisará cada día a esas horas, aunque Físico esté cerrada.</div>
            <div className="group__row">
              Si no se abre la ventana, usa «Compartir el archivo» → «Guardar en Archivos» y ábrelo desde la app Archivos.
            </div>
            <div className="group__row">
              Para cambiar las horas: en Calendario toca un aviso → «Eliminar evento» → «Eliminar todos los eventos futuros», y vuelve a añadirlos desde aquí.
            </div>
          </div>
        </>
      )}
    </>
  );
}
