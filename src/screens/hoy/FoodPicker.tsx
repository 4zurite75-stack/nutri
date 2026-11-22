import { useEffect, useMemo, useState } from 'react';
import { Camera, PenLine, ScanBarcode } from 'lucide-react';
import { Sheet, SheetHeader } from '../../ui/Sheet';
import { Segmented } from '../../ui/controls';
import { searchFoods, useFoods } from '../../db/hooks';
import type { Food, Meal } from '../../db/types';
import { FoodRow } from '../alimentos/FoodRow';
import { QuantitySheet } from './QuantitySheet';
import { SearchBox } from '../../ui/SearchBox';
import { useFoodCapture } from '../alimentos/useFoodCapture';

type Tab = 'recientes' | 'favoritos' | 'recetas' | 'todos';

interface Props {
  open: boolean;
  onClose: () => void;
  date: string;
  meal: string;
  meals: Meal[];
}

export function FoodPicker({ open, onClose, date, meal, meals }: Props) {
  const foods = useFoods();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('recientes');
  const [selected, setSelected] = useState<Food | null>(null);
  const [added, setAdded] = useState(0);
  const capture = useFoodCapture((f) => setSelected(f));

  useEffect(() => {
    if (open) {
      setQ('');
      setAdded(0);
    }
  }, [open]);

  const recent = useMemo(
    () => (foods ?? []).filter((f) => f.lastUsedAt).sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)).slice(0, 40),
    [foods],
  );
  useEffect(() => {
    // Sin historial, la pestaña de recientes estaría vacía: se abre en "Todos".
    if (open && foods && recent.length === 0) setTab('todos');
  }, [open, foods, recent.length]);

  const list = useMemo(() => {
    const all = foods ?? [];
    if (q.trim()) return searchFoods(all, q).slice(0, 80);
    if (tab === 'recientes') return recent;
    if (tab === 'favoritos') return all.filter((f) => f.favorite);
    if (tab === 'recetas') return all.filter((f) => f.recipe);
    return searchFoods(all, '');
  }, [foods, q, tab, recent]);

  const mealName = meals.find((m) => m.id === meal)?.name ?? '';

  return (
    <Sheet open={open} onClose={onClose} size="full">
      <SheetHeader
        title={mealName}
        left={<span className="sheet-header__count">{added > 0 ? `${added} añadido${added > 1 ? 's' : ''}` : ''}</span>}
        right={
          <button className="link-btn is-bold" onClick={onClose}>
            Hecho
          </button>
        }
      />
      <div className="picker-filters">
        <SearchBox value={q} onChange={setQ} placeholder="Buscar alimento o marca" />
        <div className="capture-row">
          <button className="capture-btn" onClick={capture.scan}>
            <ScanBarcode size={20} />
            Código
          </button>
          <button className="capture-btn" onClick={capture.photo}>
            <Camera size={20} />
            Etiqueta
          </button>
          <button className="capture-btn" onClick={() => capture.create(q)}>
            <PenLine size={20} />
            Crear
          </button>
        </div>
        {!q.trim() && (
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'recientes', label: 'Recientes' },
              { value: 'favoritos', label: 'Favoritos' },
              { value: 'recetas', label: 'Recetas' },
              { value: 'todos', label: 'Todos' },
            ]}
          />
        )}
      </div>
      <div className="sheet-scroll list-plain">
        {list.map((f) => (
          <FoodRow key={f.id} food={f} onClick={() => setSelected(f)} />
        ))}
        {foods && list.length === 0 && (
          <div className="empty">
            <div className="empty__title">{q ? 'Sin resultados' : tab === 'favoritos' ? 'Sin favoritos' : 'Nada por aquí'}</div>
            <div className="empty__text">
              {q ? 'Escanea el código de barras, haz una foto de la etiqueta o créalo a mano.' : 'Marca alimentos con ★ para tenerlos a mano.'}
            </div>
            {q && (
              <button className="btn btn--tinted" onClick={() => capture.create(q)}>
                Crear «{q}»
              </button>
            )}
          </div>
        )}
      </div>
      <QuantitySheet
        food={selected}
        date={date}
        meal={meal}
        meals={meals}
        onClose={() => setSelected(null)}
        onAdded={() => setAdded((n) => n + 1)}
      />
      {capture.ui}
    </Sheet>
  );
}
