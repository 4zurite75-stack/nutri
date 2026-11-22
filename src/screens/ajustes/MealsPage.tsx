import { Plus, X } from 'lucide-react';
import { Page } from '../../ui/Page';
import { setSetting, useSettings } from '../../state/settings';
import { SortableList } from '../../ui/SortableList';
import type { Meal } from '../../db/types';
import { uid } from '../../lib/id';
import { confirm } from '../../ui/uiStore';
import { db } from '../../db/db';

export function MealsPage() {
  const s = useSettings();
  const meals = s.meals;
  const save = (m: Meal[]) => void setSetting('meals', m);
  return (
    <Page title="Comidas del día" back="Ajustes">
      <div className="reorder-list" style={{ paddingTop: 12 }}>
        <SortableList
          items={meals}
          getId={(m) => m.id}
          onReorder={save}
          render={(m, handle) => (
            <div className="reorder-row">
              <input className="meal-name-input" value={m.name} onChange={(e) => save(meals.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)))} />
              <button
                className="icon-btn icon-btn--muted"
                aria-label={`Quitar ${m.name}`}
                disabled={meals.length <= 1}
                onClick={async () => {
                  const used = await db.entries.filter((e) => e.meal === m.id).count();
                  if (used && !(await confirm({ title: `¿Quitar «${m.name}»?`, message: `Tiene ${used} registros: dejarán de verse en Hoy, pero cuentan en tus totales.`, confirmText: 'Quitar', destructive: true }))) return;
                  save(meals.filter((x) => x.id !== m.id));
                }}
              >
                <X size={18} />
              </button>
              {handle}
            </div>
          )}
        />
        <button className="add-set" onClick={() => save([...meals, { id: uid(), name: 'Nueva comida' }])}>
          <Plus size={17} /> Añadir comida
        </button>
      </div>
      <p className="hint group-hint">Toca el nombre para cambiarlo y arrastra ⋮⋮ para ordenar (por ejemplo, «Pre-entreno» o «Post-entreno»).</p>
    </Page>
  );
}
