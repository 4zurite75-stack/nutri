import { MoreHorizontal, Plus } from 'lucide-react';
import type { Entry, Meal } from '../../db/types';
import { scale, sum } from '../../lib/nutrition';
import { fmtK, fmtKg } from '../../lib/format';
import { SwipeRow } from '../../ui/SwipeRow';
import { MacroInline } from '../../ui/macros';
import { deleteEntry } from '../../db/actions';
import { toast } from '../../ui/uiStore';
import { db } from '../../db/db';

function amountText(e: Entry) {
  const unit = e.unit ?? 'g';
  if (e.portionName && e.portionQty) {
    const q = fmtKg(e.portionQty);
    const name = e.portionName.replace(/^1\s+/, '');
    return `${q} × ${name} · ${fmtKg(Math.round(e.grams))} ${unit}`;
  }
  return `${fmtKg(Math.round(e.grams * 10) / 10)} ${unit}`;
}

export function MealSection({
  meal,
  entries,
  onAdd,
  onEdit,
  onMenu,
}: {
  meal: Meal;
  entries: Entry[];
  onAdd: () => void;
  onEdit: (e: Entry) => void;
  onMenu: () => void;
}) {
  const totals = sum(entries.map((e) => scale(e.per100, e.grams)));
  return (
    <section className="meal">
      <header className="meal__head">
        <div className="meal__title">
          <h3>{meal.name}</h3>
          {entries.length > 0 && (
            <span className="meal__sub">
              {fmtK(totals.kcal)} kcal · <MacroInline n={totals} />
            </span>
          )}
        </div>
        <button className="icon-btn icon-btn--muted" onClick={onMenu} aria-label={`Opciones de ${meal.name}`}>
          <MoreHorizontal size={22} />
        </button>
      </header>
      {entries.length > 0 && (
        <div className="meal__list">
          {entries.map((e) => {
            const n = scale(e.per100, e.grams);
            return (
              <SwipeRow
                key={e.id}
                onDelete={async () => {
                  await deleteEntry(e.id);
                  toast(`${e.name} quitado`, { duration: 4000, action: { label: 'Deshacer', onClick: () => void db.entries.put(e) } });
                }}
              >
                <button className="entry" onClick={() => onEdit(e)}>
                  <span className="entry__text">
                    <span className="entry__name">{e.name}</span>
                    <span className="entry__meta">
                      {e.brand ? `${e.brand} · ` : ''}
                      {amountText(e)}
                    </span>
                  </span>
                  <span className="entry__kcal">
                    {fmtK(n.kcal)}
                    <small>kcal</small>
                  </span>
                </button>
              </SwipeRow>
            );
          })}
        </div>
      )}
      <button className="meal__add" onClick={onAdd}>
        <Plus size={18} strokeWidth={2.6} /> Añadir alimento
      </button>
    </section>
  );
}

