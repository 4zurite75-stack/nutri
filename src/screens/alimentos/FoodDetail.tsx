import { useState } from 'react';
import { ChefHat, Pencil, Star, Trash2 } from 'lucide-react';
import { useFood } from '../../db/hooks';
import { db } from '../../db/db';
import { Page } from '../../ui/Page';
import { Chip } from '../../ui/controls';
import { scale } from '../../lib/nutrition';
import { fmtG, fmtK, fmtKg } from '../../lib/format';
import { FoodForm, draftFromFood, type FoodDraft } from './FoodForm';
import { confirm, toast } from '../../ui/uiStore';
import { pop, push } from '../../nav/nav';
import { useObjectURL } from '../../ui/useObjectURL';
import { MacroSplit } from '../onboarding/PlanSummary';
import { RecipeEditor } from './RecipeEditor';

const SOURCE: Record<string, string> = {
  generico: 'Base genérica (valores aproximados)',
  off: 'Open Food Facts',
  ia: 'Leído de la etiqueta con IA',
  manual: 'Creado a mano',
  receta: 'Receta',
};

export function FoodDetail({ id }: { id: string }) {
  const food = useFood(id);
  const [draft, setDraft] = useState<FoodDraft | null>(null);
  const [basis, setBasis] = useState<string>('100');
  const thumb = useObjectURL(food?.thumb);
  if (!food) return <Page title="" back />;

  const portion = food.portions.find((p) => p.id === basis);
  const grams = portion ? portion.grams : 100;
  const n = scale(food.per100, grams);
  const rows: [string, number, string, boolean?][] = [
    ['Energía', n.kcal, 'kcal'],
    ['Grasas', n.fat, 'g'],
    ['de las cuales saturadas', n.satFat ?? 0, 'g', true],
    ['Hidratos de carbono', n.carbs, 'g'],
    ['de los cuales azúcares', n.sugar ?? 0, 'g', true],
    ['Fibra', n.fiber ?? 0, 'g'],
    ['Proteínas', n.protein, 'g'],
    ['Sal', n.salt ?? 0, 'g'],
  ];

  const remove = async () => {
    const used = await db.entries.where('foodId').equals(id).count();
    if (!(await confirm({ title: `¿Eliminar «${food.name}»?`, message: used ? 'Tus registros pasados no cambian.' : undefined, confirmText: 'Eliminar', destructive: true }))) return;
    await db.foods.update(id, { deletedAt: Date.now() });
    toast('Alimento eliminado');
    pop();
  };

  return (
    <Page
      title={food.name}
      back
      right={
        <button className="icon-btn" onClick={() => void db.foods.update(id, { favorite: !food.favorite })} aria-label="Favorito">
          <Star size={22} fill={food.favorite ? 'currentColor' : 'none'} />
        </button>
      }
    >
      <div className="fd-hero">
        {thumb ? <img src={thumb} alt="" /> : <div className="fd-hero__ph">{food.recipe ? <ChefHat size={28} /> : food.name.charAt(0)}</div>}
        <div>
          <h2>{food.name}</h2>
          <p className="muted">
            {food.brand && `${food.brand} · `}
            {SOURCE[food.recipe ? 'receta' : food.source]}
          </p>
          {food.barcode && <p className="muted fd-hero__code">{food.barcode}</p>}
        </div>
      </div>

      <div className="section">
        <div className="chips-scroll">
          <Chip active={!portion} onClick={() => setBasis('100')}>
            100 {food.unit}
          </Chip>
          {food.portions.map((p) => (
            <Chip key={p.id} active={basis === p.id} onClick={() => setBasis(p.id)}>
              {p.name} ({fmtKg(p.grams)} {food.unit})
            </Chip>
          ))}
        </div>
      </div>
      <div className="fd-kcal">
        <b>{fmtK(n.kcal)}</b> kcal
      </div>
      <div className="section">
        <MacroSplit protein={n.protein} carbs={n.carbs} fat={n.fat} />
      </div>
      <div className="group-title">Información nutricional · {portion ? portion.name : `100 ${food.unit}`}</div>
      <div className="group">
        {rows.map(([label, v, u, indent]) => (
          <div key={label} className={`group__row ${indent ? 'is-indent' : ''}`}>
            <span>{label}</span>
            <span className="group__value">
              {u === 'kcal' ? fmtK(v) : label === 'Sal' ? fmtKg(Math.round(v * 100) / 100) : fmtG(v)} {u}
            </span>
          </div>
        ))}
      </div>

      <div className="form" style={{ marginTop: 18 }}>
        <button
          className="btn btn--tinted btn--block"
          onClick={() => (food.recipe ? push(() => <RecipeEditor id={food.id} />) : setDraft(draftFromFood(food)))}
        >
          <Pencil size={18} /> {food.recipe ? 'Editar receta' : 'Editar valores'}
        </button>
      </div>
      <button className="btn btn--danger-plain" onClick={() => void remove()}>
        <Trash2 size={18} /> Eliminar
      </button>
      <FoodForm draft={draft} food={food} onClose={() => setDraft(null)} />
    </Page>
  );
}
