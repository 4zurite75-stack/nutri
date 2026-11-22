import { useState } from 'react';
import { Plus } from 'lucide-react';
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
  const [key, setKey] = useState<string | null>(null);
  const k = supp === undefined ? null : supp?.id ?? 'new';
  if (k !== key) {
    setKey(k);
    setName(supp?.name ?? '');
    setDose(supp ? fmtKg(supp.dose) : '');
    setUnit(supp?.unit ?? 'g');
    setTime(supp?.time ?? '');
  }
  const save = async () => {
    const count = await db.supplements.count();
    await db.supplements.put({
      id: supp?.id ?? uid(),
      name: name.trim(),
      dose: parseNum(dose) ?? 0,
      unit: unit.trim() || 'g',
      time: time.trim() || undefined,
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
      <Editor supp={editing} onClose={() => setEditing(undefined)} />
    </Page>
  );
}
