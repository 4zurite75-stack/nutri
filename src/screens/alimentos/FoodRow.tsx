import { ChefHat, Plus, Star } from 'lucide-react';
import type { Food } from '../../db/types';
import { fmtK } from '../../lib/format';
import { MacroInline } from '../../ui/macros';

export function FoodRow({ food, onClick, onQuickAdd }: { food: Food; onClick: () => void; onQuickAdd?: () => void }) {
  return (
    <div className="frow">
      <button className="frow__main" onClick={onClick}>
        <span className="frow__name">
          {food.recipe && <ChefHat size={14} className="frow__icon" />}
          {food.favorite && <Star size={13} className="frow__star" fill="currentColor" />}
          {food.name}
        </span>
        <span className="frow__meta">
          {food.brand && <span className="frow__brand">{food.brand} · </span>}
          {fmtK(food.per100.kcal)} kcal/100 {food.unit}
          <MacroInline n={food.per100} />
        </span>
      </button>
      {onQuickAdd && (
        <button className="frow__add" onClick={onQuickAdd} aria-label={`Añadir ${food.name}`}>
          <Plus size={20} strokeWidth={2.6} />
        </button>
      )}
    </div>
  );
}
