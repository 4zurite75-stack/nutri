import { useEffect, useState } from 'react';
import { AlertTriangle, Camera, Plus, Sparkles, X } from 'lucide-react';
import { Sheet, SheetHeader } from '../../ui/Sheet';
import { Segmented } from '../../ui/controls';
import { NumField, cleanNum, parseNum } from '../../ui/fields';
import type { Food, FoodSource, Nutrients } from '../../db/types';
import { kcalFromMacros } from '../../lib/nutrition';
import { fmtK, fmtKg } from '../../lib/format';
import { uid } from '../../lib/id';
import { db } from '../../db/db';
import { toast } from '../../ui/uiStore';
import { useObjectURL } from '../../ui/useObjectURL';

type NKey = keyof Required<Nutrients>;
const NUTRIENTS: { key: NKey; label: string; required?: boolean; indent?: boolean; unit: string }[] = [
  { key: 'kcal', label: 'Energía', required: true, unit: 'kcal' },
  { key: 'fat', label: 'Grasas', required: true, unit: 'g' },
  { key: 'satFat', label: 'de las cuales saturadas', indent: true, unit: 'g' },
  { key: 'carbs', label: 'Hidratos de carbono', required: true, unit: 'g' },
  { key: 'sugar', label: 'de los cuales azúcares', indent: true, unit: 'g' },
  { key: 'fiber', label: 'Fibra', unit: 'g' },
  { key: 'protein', label: 'Proteínas', required: true, unit: 'g' },
  { key: 'salt', label: 'Sal', unit: 'g' },
];

export interface FoodDraft {
  name: string;
  brand: string;
  barcode: string;
  unit: 'g' | 'ml';
  values: Partial<Record<NKey, string>>;
  portions: { id: string; name: string; grams: string }[];
  source: FoodSource;
  thumb?: Blob;
  /** Foto de referencia (etiqueta) que se muestra mientras revisas; no se guarda. */
  refImage?: Blob;
  notes?: string;
}

const str = (n: number | undefined | null) => (n == null ? '' : fmtKg(Math.round(n * 100) / 100));

export function draftFromNutrients(per100: Partial<Nutrients>): FoodDraft['values'] {
  const out: FoodDraft['values'] = {};
  for (const { key } of NUTRIENTS) out[key] = str(per100[key]);
  return out;
}

export function emptyDraft(p: Partial<FoodDraft> = {}): FoodDraft {
  return { name: '', brand: '', barcode: '', unit: 'g', values: {}, portions: [], source: 'manual', ...p };
}

export function draftFromFood(f: Food): FoodDraft {
  return {
    name: f.name,
    brand: f.brand ?? '',
    barcode: f.barcode ?? '',
    unit: f.unit,
    values: draftFromNutrients(f.per100),
    portions: f.portions.map((p) => ({ id: p.id, name: p.name, grams: str(p.grams) })),
    source: f.source,
    thumb: f.thumb,
  };
}

function RefImage({ blob }: { blob: Blob }) {
  const url = useObjectURL(blob);
  return url ? <img className="ffo__ref" src={url} alt="Foto de la etiqueta" /> : null;
}

interface Props {
  draft: FoodDraft | null;
  food?: Food | null;
  title?: string;
  onClose: () => void;
  onSaved?: (f: Food) => void;
  /** Si existe, muestra el botón para leer la etiqueta con una foto. */
  onPhoto?: () => void;
}

export function FoodForm({ draft, food, title, onClose, onSaved, onPhoto }: Props) {
  const [d, setD] = useState<FoodDraft>(emptyDraft());
  useEffect(() => {
    if (draft) setD(draft);
  }, [draft]);
  const set = (p: Partial<FoodDraft>) => setD((x) => ({ ...x, ...p }));
  const setV = (k: NKey, v: string) => setD((x) => ({ ...x, values: { ...x.values, [k]: v } }));

  const n = (k: NKey) => parseNum(d.values[k] ?? '');
  const per100: Nutrients = {
    kcal: n('kcal') ?? 0,
    protein: n('protein') ?? 0,
    carbs: n('carbs') ?? 0,
    fat: n('fat') ?? 0,
    sugar: n('sugar') ?? undefined,
    satFat: n('satFat') ?? undefined,
    fiber: n('fiber') ?? undefined,
    salt: n('salt') ?? undefined,
  };
  const computed = kcalFromMacros(per100);
  const missing = NUTRIENTS.filter((x) => x.required && n(x.key) == null);
  const kcalOff = n('kcal') != null && computed > 0 && Math.abs(per100.kcal - computed) > Math.max(20, computed * 0.15);
  const massOff = per100.protein + per100.carbs + per100.fat + (per100.fiber ?? 0) > 101;
  const subOff = (per100.sugar ?? 0) > per100.carbs + 0.5 || (per100.satFat ?? 0) > per100.fat + 0.5;
  const valid = d.name.trim().length > 0 && missing.length === 0;

  const save = async () => {
    if (!valid) return;
    const now = Date.now();
    const barcode = d.barcode.trim() || undefined;
    if (barcode) {
      const dup = await db.foods.where('barcode').equals(barcode).first();
      if (dup && dup.id !== food?.id && !dup.deletedAt) {
        toast(`Ese código ya está guardado como «${dup.name}»`);
        return;
      }
    }
    const f: Food = {
      ...(food ?? { id: uid(), createdAt: now, source: d.source }),
      name: d.name.trim(),
      brand: d.brand.trim() || undefined,
      barcode,
      unit: d.unit,
      per100,
      portions: d.portions
        .map((p) => ({ id: p.id, name: p.name.trim(), grams: parseNum(p.grams) ?? 0 }))
        .filter((p) => p.name && p.grams > 0),
      thumb: d.thumb ?? food?.thumb,
      updatedAt: now,
    } as Food;
    await db.foods.put(f);
    toast(food ? 'Alimento actualizado' : 'Alimento guardado', { tone: 'success' });
    onSaved?.(f);
    onClose();
  };

  return (
    <Sheet open={!!draft} onClose={onClose} size="full">
      <SheetHeader
        title={title ?? (food ? 'Editar alimento' : 'Nuevo alimento')}
        left={
          <button className="link-btn" onClick={onClose}>
            Cancelar
          </button>
        }
        right={
          <button className="link-btn is-bold" disabled={!valid} onClick={() => void save()}>
            Guardar
          </button>
        }
      />
      <div className="sheet-scroll form ffo">
        {d.refImage && <RefImage blob={d.refImage} />}
        {d.source === 'ia' && (
          <div className="ffo__banner">
            <Sparkles size={16} /> Leído con IA. Comprueba los valores con la etiqueta antes de guardar.
          </div>
        )}
        {d.source === 'off' && <div className="ffo__banner">Datos de Open Food Facts. Revísalos con la etiqueta si puedes.</div>}
        {onPhoto && (
          <button className="btn btn--tinted btn--block" onClick={onPhoto}>
            <Camera size={18} /> Leer la etiqueta con una foto
          </button>
        )}
        {d.notes && (
          <div className="ffo__warn">
            <AlertTriangle size={16} /> {d.notes}
          </div>
        )}
        <label className="field">
          <span className="field__label">Nombre</span>
          <input className="input" value={d.name} placeholder="Ej.: Yogur proteínico natural" onChange={(e) => set({ name: e.target.value })} />
        </label>
        <div className="numfield-grid">
          <label className="field">
            <span className="field__label">Marca (opcional)</span>
            <input className="input" value={d.brand} onChange={(e) => set({ brand: e.target.value })} />
          </label>
          <label className="field">
            <span className="field__label">Código de barras</span>
            <input className="input" inputMode="numeric" value={d.barcode} onChange={(e) => set({ barcode: cleanNum(e.target.value, false) })} />
          </label>
        </div>
        <div className="field">
          <span className="field__label">Valores por 100 {d.unit}</span>
          <Segmented
            value={d.unit}
            onChange={(u) => set({ unit: u })}
            options={[
              { value: 'g', label: 'Por 100 g' },
              { value: 'ml', label: 'Por 100 ml' },
            ]}
          />
        </div>
        <div className="ntable">
          {NUTRIENTS.map((x) => (
            <label key={x.key} className={`ntable__row ${x.indent ? 'is-indent' : ''} ${x.required && n(x.key) == null ? 'is-missing' : ''}`}>
              <span>{x.label}</span>
              <input inputMode="decimal" value={d.values[x.key] ?? ''} placeholder="—" onFocus={(e) => e.currentTarget.select()} onChange={(e) => setV(x.key, cleanNum(e.target.value))} />
              <small>{x.unit}</small>
            </label>
          ))}
        </div>
        {(kcalOff || massOff || subOff) && (
          <div className="ffo__warn">
            <AlertTriangle size={16} />
            <span>
              {kcalOff && (
                <>
                  Las kcal no cuadran con los macros (salen unas {fmtK(computed)} kcal).{' '}
                  <button className="inline-link" onClick={() => setV('kcal', fmtK(computed).replace('.', ''))}>
                    Usar {fmtK(computed)}
                  </button>
                  <br />
                </>
              )}
              {massOff && 'Proteína + hidratos + grasa + fibra suman más de 100 g. '}
              {subOff && 'Los azúcares o las saturadas no pueden superar a su total.'}
            </span>
          </div>
        )}
        <div className="field">
          <span className="field__label">Porciones (opcional)</span>
          {d.portions.map((p, i) => (
            <div key={p.id} className="portion-row">
              <input
                className="input"
                placeholder="1 unidad"
                value={p.name}
                onChange={(e) => set({ portions: d.portions.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
              />
              <NumField label="" value={p.grams} unit={d.unit} onChange={(v) => set({ portions: d.portions.map((x, j) => (j === i ? { ...x, grams: v } : x)) })} />
              <button className="icon-btn icon-btn--muted" aria-label="Quitar porción" onClick={() => set({ portions: d.portions.filter((_, j) => j !== i) })}>
                <X size={18} />
              </button>
            </div>
          ))}
          <button className="add-set" onClick={() => set({ portions: [...d.portions, { id: uid(), name: '', grams: '' }] })}>
            <Plus size={17} /> Añadir porción (p. ej. «1 yogur = 125 g»)
          </button>
        </div>
      </div>
    </Sheet>
  );
}
