import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, X } from 'lucide-react';
import { db } from '../../db/db';
import type { Food } from '../../db/types';
import { Page } from '../../ui/Page';
import { Stepper } from '../../ui/controls';
import { NumField, cleanNum, parseNum } from '../../ui/fields';
import { scale, sum } from '../../lib/nutrition';
import { fmtG, fmtK, fmtKg } from '../../lib/format';
import { uid } from '../../lib/id';
import { pop } from '../../nav/nav';
import { confirm, toast } from '../../ui/uiStore';
import { IngredientPicker } from './IngredientPicker';
import { MacroInline } from '../../ui/macros';

interface Row {
  key: string;
  food: Food;
  grams: string;
}

export function RecipeEditor({ id }: { id?: string }) {
  const existing = useLiveQuery(() => (id ? db.foods.get(id) : undefined), [id]);
  const [name, setName] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [finalWeight, setFinalWeight] = useState('');
  const [servings, setServings] = useState(1);
  const [picking, setPicking] = useState(false);
  const [loaded, setLoaded] = useState(!id);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!existing?.recipe || loaded) return;
    void (async () => {
      const foods = await db.foods.bulkGet(existing.recipe!.items.map((i) => i.foodId));
      setName(existing.name);
      setRows(existing.recipe!.items.map((it, i) => ({ key: uid(), food: foods[i]!, grams: fmtKg(it.grams) })).filter((r) => r.food));
      setFinalWeight(fmtKg(existing.recipe!.totalWeight));
      setServings(existing.recipe!.servings);
      setLoaded(true);
    })();
  }, [existing, loaded]);

  const rawWeight = rows.reduce((a, r) => a + (parseNum(r.grams) ?? 0), 0);
  const total = useMemo(() => sum(rows.map((r) => scale(r.food.per100, parseNum(r.grams) ?? 0))), [rows]);
  const cooked = parseNum(finalWeight) ?? rawWeight;
  const serving = { kcal: total.kcal / servings, protein: total.protein / servings, carbs: total.carbs / servings, fat: total.fat / servings };
  const valid = name.trim() && rows.length > 0 && cooked > 0;

  const save = async () => {
    if (!valid) return;
    const now = Date.now();
    const f = (x: number) => Math.round((x / cooked) * 100 * 100) / 100;
    const food: Food = {
      id: existing?.id ?? uid(),
      name: name.trim(),
      unit: 'g',
      per100: {
        kcal: f(total.kcal),
        protein: f(total.protein),
        carbs: f(total.carbs),
        fat: f(total.fat),
        sugar: f(total.sugar),
        satFat: f(total.satFat),
        fiber: f(total.fiber),
        salt: f(total.salt),
      },
      portions: [{ id: `${existing?.id ?? 'r'}-racion`, name: '1 ración', grams: Math.round((cooked / servings) * 10) / 10 }],
      source: 'receta',
      recipe: { items: rows.map((r) => ({ foodId: r.food.id, grams: parseNum(r.grams) ?? 0 })), totalWeight: cooked, servings },
      favorite: existing?.favorite,
      useCount: existing?.useCount,
      lastUsedAt: existing?.lastUsedAt,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await db.foods.put(food);
    toast(existing ? 'Receta actualizada' : 'Receta guardada', { tone: 'success' });
    pop();
  };

  const cancel = async () => {
    if (dirty && !(await confirm({ title: '¿Descartar cambios?', confirmText: 'Descartar', destructive: true }))) return;
    pop();
  };

  return (
    <Page
      title={id ? 'Editar receta' : 'Nueva receta'}
      back="Cancelar"
      onBack={() => void cancel()}
      right={
        <button className="link-btn is-bold" disabled={!valid} onClick={() => void save()}>
          Guardar
        </button>
      }
    >
      <div className="form" style={{ paddingTop: 8 }}>
        <input
          className="input input--title"
          placeholder="Nombre (p. ej. Lentejas con verduras)"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
        />
      </div>
      <div className="group-title">Ingredientes (en crudo)</div>
      <div className="group">
        {rows.map((r, i) => (
          <div key={r.key} className="group__row ing-row">
            <span className="ing-row__name">
              {r.food.name}
              <small className="muted">{fmtK(scale(r.food.per100, parseNum(r.grams) ?? 0).kcal)} kcal</small>
            </span>
            <span className="ing-row__qty">
              <input
                inputMode="decimal"
                value={r.grams}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  const v = cleanNum(e.target.value);
                  setRows((l) => l.map((x, j) => (j === i ? { ...x, grams: v } : x)));
                  setDirty(true);
                }}
              />
              {r.food.unit}
            </span>
            <button className="icon-btn icon-btn--muted" aria-label="Quitar" onClick={() => setRows((l) => l.filter((_, j) => j !== i))}>
              <X size={18} />
            </button>
          </div>
        ))}
        <button className="group__row group__row--link ing-add" onClick={() => setPicking(true)}>
          <Plus size={18} /> Añadir ingrediente
        </button>
      </div>

      {rows.length > 0 && (
        <>
          <div className="form" style={{ marginTop: 18 }}>
            <NumField
              label="Peso final cocinado"
              hint={`sin cocinar suman ${fmtKg(Math.round(rawWeight))} g`}
              value={finalWeight}
              placeholder={fmtKg(Math.round(rawWeight))}
              unit="g"
              onChange={(v) => {
                setFinalWeight(v);
                setDirty(true);
              }}
            />
            <div className="field field--row">
              <span className="field__label">Raciones</span>
              <Stepper value={servings} min={1} max={30} onChange={setServings} />
            </div>
            <p className="hint" style={{ marginTop: -8 }}>
              Pesa la olla o el táper con todo cocinado (sin el recipiente): así cada ración sale bien aunque el agua cambie el peso.
            </p>
          </div>
          <div className="group-title">Resultado</div>
          <div className="group">
            <div className="group__row">
              <span>Receta completa</span>
              <span className="group__value">
                {fmtK(total.kcal)} kcal · {fmtKg(Math.round(cooked))} g
              </span>
            </div>
            <div className="group__row">
              <span>
                1 ración ({fmtKg(Math.round(cooked / servings))} g)
                <br />
                <MacroInline n={serving} />
              </span>
              <span className="group__value">
                <b>{fmtK(serving.kcal)} kcal</b>
              </span>
            </div>
            <div className="group__row">
              <span>Por 100 g</span>
              <span className="group__value">
                {fmtK((total.kcal / cooked) * 100)} kcal · P {fmtG((total.protein / cooked) * 100)} g
              </span>
            </div>
          </div>
        </>
      )}
      <IngredientPicker
        open={picking}
        excludeId={id}
        onClose={() => setPicking(false)}
        onPick={(f) => {
          setRows((l) => [...l, { key: uid(), food: f, grams: f.portions[0] ? fmtKg(f.portions[0].grams) : '100' }]);
          setDirty(true);
        }}
      />
    </Page>
  );
}
