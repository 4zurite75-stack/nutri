import { useEffect, useMemo, useRef, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Sheet, SheetHeader } from '../../ui/Sheet';
import { Chip } from '../../ui/controls';
import type { Entry, Food, Meal } from '../../db/types';
import { scale } from '../../lib/nutrition';
import { fmtG, fmtK, fmtKg } from '../../lib/format';
import { cleanNum, parseNum } from '../../ui/fields';
import { addEntry, deleteEntry, updateEntry } from '../../db/actions';
import { db } from '../../db/db';
import { toast } from '../../ui/uiStore';

interface Props {
  food: Food | null;
  entry?: Entry | null;
  date: string;
  meal: string;
  meals: Meal[];
  onClose: () => void;
  onAdded?: (e: Entry) => void;
}

export function QuantitySheet({ food, entry, date, meal, meals, onClose, onAdded }: Props) {
  const [mode, setMode] = useState<string>('g'); // 'g' o id de porción
  const [amount, setAmount] = useState('');
  const [mealId, setMealId] = useState(meal);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!food) return;
    setMealId(entry?.meal ?? meal);
    const portion = entry?.portionName ? food.portions.find((p) => p.name === entry.portionName) : undefined;
    if (entry && portion) {
      setMode(portion.id);
      setAmount(fmtKg(entry.portionQty ?? 1));
    } else if (entry) {
      setMode('g');
      setAmount(fmtKg(entry.grams));
    } else if (food.lastGrams) {
      setMode('g');
      setAmount(fmtKg(food.lastGrams));
    } else if (food.portions[0]) {
      setMode(food.portions[0].id);
      setAmount('1');
    } else {
      setMode('g');
      setAmount('100');
    }
    // El teclado se abre solo para escribir la cantidad directamente.
    const t = setTimeout(() => input.current?.select(), 380);
    return () => clearTimeout(t);
  }, [food, entry, meal]);

  const portion = food?.portions.find((p) => p.id === mode);
  const qty = parseNum(amount) ?? 0;
  const grams = portion ? qty * portion.grams : qty;
  const n = useMemo(() => (food ? scale(entry?.per100 ?? food.per100, grams) : null), [food, entry, grams]);
  const unit = food?.unit ?? 'g';

  const save = async () => {
    if (!food || grams <= 0) return;
    const portionInfo = portion ? { name: portion.name, qty } : undefined;
    if (entry) {
      await updateEntry(entry.id, { grams, meal: mealId, portionName: portionInfo?.name, portionQty: portionInfo?.qty });
      await db.foods.update(food.id, { lastGrams: grams });
    } else {
      const e = await addEntry(food, grams, mealId, date, portionInfo);
      onAdded?.(e);
      toast(`${food.name} añadido`, { tone: 'success', duration: 1600 });
    }
    onClose();
  };

  return (
    <Sheet open={!!food} onClose={onClose}>
      {food && n && (
        <>
          <SheetHeader
            title={entry ? 'Editar' : 'Añadir'}
            left={
              <button className="link-btn" onClick={onClose}>
                Cancelar
              </button>
            }
            right={
              <button
                className="icon-btn"
                aria-label={food.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                onClick={() => void db.foods.update(food.id, { favorite: !food.favorite })}
              >
                <Star size={22} fill={food.favorite ? 'currentColor' : 'none'} />
              </button>
            }
          />
          <div className="qty">
            <div className="qty__name">
              {food.name}
              {food.brand && <small>{food.brand}</small>}
            </div>
            <div className="qty__input">
              <input
                ref={input}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(cleanNum(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && void save()}
                aria-label="Cantidad"
              />
              <span>{portion ? (qty === 1 ? 'ración' : 'raciones') : unit}</span>
            </div>
            {portion && qty > 15 && (
              <button
                className="qty__warn"
                onClick={() => {
                  setMode('g');
                  setAmount(amount);
                }}
              >
                {fmtKg(qty)} raciones son {fmtK(grams)} {unit}. ¿Querías decir {fmtKg(qty)} {unit}? Toca para cambiar.
              </button>
            )}
            <div className="chips-scroll qty__units">
              <Chip
                active={mode === 'g'}
                onClick={() => {
                  setMode('g');
                  setAmount(fmtKg(Math.round(grams)) || '100');
                }}
              >
                {unit}
              </Chip>
              {food.portions.map((p) => (
                <Chip
                  key={p.id}
                  active={mode === p.id}
                  onClick={() => {
                    setMode(p.id);
                    setAmount('1');
                  }}
                >
                  {p.name} ({fmtKg(p.grams)} {unit})
                </Chip>
              ))}
            </div>
            <div className="qty__preview">
              <div className="qty__kcal">
                <b>{fmtK(n.kcal)}</b>
                <span>kcal{portion ? ` · ${fmtK(grams)} ${unit}` : ''}</span>
              </div>
              <div className="qty__macros">
                <span>
                  <i className="dot dot--p" />
                  <b>{fmtG(n.protein)} g</b> proteína
                </span>
                <span>
                  <i className="dot dot--c" />
                  <b>{fmtG(n.carbs)} g</b> hidratos
                </span>
                <span>
                  <i className="dot dot--f" />
                  <b>{fmtG(n.fat)} g</b> grasa
                </span>
              </div>
            </div>
            <div className="chips-scroll">
              {meals.map((m) => (
                <Chip key={m.id} active={mealId === m.id} onClick={() => setMealId(m.id)}>
                  {m.name}
                </Chip>
              ))}
            </div>
            <button className="btn btn--primary btn--block btn--lg" disabled={grams <= 0} onClick={() => void save()}>
              {entry ? 'Guardar' : `Añadir a ${meals.find((m) => m.id === mealId)?.name ?? 'la comida'}`}
            </button>
            {entry && (
              <button
                className="btn btn--danger-plain"
                onClick={async () => {
                  await deleteEntry(entry.id);
                  onClose();
                }}
              >
                <Trash2 size={18} /> Quitar del diario
              </button>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
