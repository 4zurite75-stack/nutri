import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetHeader } from '../../ui/Sheet';
import { SearchBox } from '../../ui/SearchBox';
import { searchFoods, useFoods } from '../../db/hooks';
import type { Food } from '../../db/types';
import { FoodRow } from './FoodRow';

export function IngredientPicker({ open, onClose, onPick, excludeId }: { open: boolean; onClose: () => void; onPick: (f: Food) => void; excludeId?: string }) {
  const foods = useFoods();
  const [q, setQ] = useState('');
  useEffect(() => {
    if (open) setQ('');
  }, [open]);
  const list = useMemo(() => searchFoods((foods ?? []).filter((f) => f.id !== excludeId), q).slice(0, 80), [foods, q, excludeId]);
  return (
    <Sheet open={open} onClose={onClose} size="full">
      <SheetHeader
        title="Añadir ingrediente"
        left={
          <button className="link-btn" onClick={onClose}>
            Cancelar
          </button>
        }
      />
      <div className="picker-filters">
        <SearchBox value={q} onChange={setQ} placeholder="Buscar alimento" />
      </div>
      <div className="sheet-scroll list-plain">
        {list.map((f) => (
          <FoodRow
            key={f.id}
            food={f}
            onClick={() => {
              onPick(f);
              onClose();
            }}
          />
        ))}
      </div>
    </Sheet>
  );
}
