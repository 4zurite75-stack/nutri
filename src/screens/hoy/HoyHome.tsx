import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookmarkPlus, CalendarClock, ChevronLeft, ChevronRight, Copy, LayoutTemplate, MoreHorizontal, Trash2 } from 'lucide-react';
import { useSettings } from '../../state/settings';
import { useDay, useEntries, useSupplements } from '../../db/hooks';
import { db } from '../../db/db';
import type { Entry, Food, MealTemplate } from '../../db/types';
import { scale, sum } from '../../lib/nutrition';
import { addDays, dayLabel, fmtDateLong, fmtK, isoDate, isoToTs } from '../../lib/format';
import { KcalRing, MacroBar } from '../../ui/macros';
import { MealSection } from './MealSection';
import { FoodPicker } from './FoodPicker';
import { QuantitySheet } from './QuantitySheet';
import { SupplementsCard, WaterCard, WeightCard } from './DayCards';
import { applyTemplate, copyEntries, saveTemplate } from '../../db/actions';
import { confirm, showActions, toast } from '../../ui/uiStore';
import { PromptSheet } from '../../ui/PromptSheet';
import { CheckInCard } from '../progreso/CheckInCard';
import { useAnalysis } from '../progreso/useAnalysis';
import { ModeSwitch } from '../../nav/ModeSwitch';

const WEEK = 7 * 86400000;

export function HoyHome() {
  const s = useSettings();
  const [date, setDate] = useState(isoDate());
  const entries = useEntries(date) ?? [];
  const day = useDay(date);
  const supplements = useSupplements() ?? [];
  const templates = useLiveQuery(() => db.templates.orderBy('createdAt').reverse().toArray(), [], [] as MealTemplate[]);
  const analysis = useAnalysis();
  const [picker, setPicker] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ entry: Entry; food: Food } | null>(null);
  const [templateFor, setTemplateFor] = useState<{ scope: 'dia' | 'comida'; meal?: string } | null>(null);
  const t = s.targets;
  const totals = useMemo(() => sum(entries.map((e) => scale(e.per100, e.grams))), [entries]);
  const byMeal = (id: string) => entries.filter((e) => e.meal === id);
  const yesterday = addDays(date, -1);
  const isToday = date === isoDate();

  const checkInDue =
    analysis &&
    isToday &&
    s.profile &&
    Date.now() - Math.max(s.lastCheckInAt, s.profile.createdAt) >= WEEK &&
    analysis.verdict !== 'datos';

  const openEdit = async (e: Entry) => {
    const food = await db.foods.get(e.foodId);
    // Si el alimento se borró, se edita con los datos copiados en la entrada.
    setEditing({ entry: e, food: food ?? ({ id: e.foodId, name: e.name, brand: e.brand, unit: 'g', per100: e.per100, portions: [], source: 'manual', createdAt: 0, updatedAt: 0 } as Food) });
  };

  const mealMenu = (mealId: string) => {
    const list = byMeal(mealId);
    const name = s.meals.find((m) => m.id === mealId)?.name ?? '';
    const mealTemplates = templates.filter((x) => x.scope === 'comida');
    showActions({
      title: name,
      actions: [
        {
          label: `Copiar ${name.toLowerCase()} de ${dayLabel(yesterday).toLowerCase()}`,
          icon: <Copy size={18} />,
          onSelect: async () => {
            const n = await copyEntries(yesterday, mealId, date, mealId);
            toast(n ? `${n} alimento${n > 1 ? 's' : ''} copiado${n > 1 ? 's' : ''}` : `No había nada en ${name.toLowerCase()} ese día`);
          },
        },
        ...(mealTemplates.length
          ? [
              {
                label: 'Añadir desde plantilla',
                icon: <LayoutTemplate size={18} />,
                onSelect: () =>
                  showActions({
                    title: 'Plantillas de comida',
                    actions: mealTemplates.map((tp) => ({
                      label: `${tp.name} (${tp.items.length})`,
                      onSelect: async () => {
                        const n = await applyTemplate(tp, date, mealId);
                        toast(`${n} alimentos añadidos`, { tone: 'success' });
                      },
                    })),
                  }),
              },
            ]
          : []),
        ...(list.length
          ? [
              { label: 'Guardar como plantilla', icon: <BookmarkPlus size={18} />, onSelect: () => setTemplateFor({ scope: 'comida', meal: mealId }) },
              {
                label: `Vaciar ${name.toLowerCase()}`,
                icon: <Trash2 size={18} />,
                destructive: true,
                onSelect: async () => {
                  if (await confirm({ title: `¿Vaciar ${name.toLowerCase()}?`, confirmText: 'Vaciar', destructive: true })) {
                    await db.entries.bulkDelete(list.map((e) => e.id));
                  }
                },
              },
            ]
          : []),
      ],
    });
  };

  const dayMenu = () => {
    const dayTemplates = templates.filter((x) => x.scope === 'dia');
    showActions({
      title: fmtDateLong(isoToTs(date)),
      actions: [
        {
          label: `Copiar todo ${dayLabel(yesterday).toLowerCase() === 'ayer' ? 'lo de ayer' : `el ${dayLabel(yesterday).toLowerCase()}`}`,
          icon: <Copy size={18} />,
          onSelect: async () => {
            const n = await copyEntries(yesterday, null, date);
            toast(n ? `${n} alimentos copiados` : 'Ese día no tiene registros');
          },
        },
        ...(dayTemplates.length
          ? [
              {
                label: 'Aplicar menú guardado',
                icon: <LayoutTemplate size={18} />,
                onSelect: () =>
                  showActions({
                    title: 'Menús guardados',
                    actions: dayTemplates.map((tp) => ({
                      label: `${tp.name} (${tp.items.length})`,
                      onSelect: async () => {
                        const n = await applyTemplate(tp, date);
                        toast(`${n} alimentos añadidos`, { tone: 'success' });
                      },
                    })),
                  }),
              },
            ]
          : []),
        ...(entries.length ? [{ label: 'Guardar el día como menú', icon: <BookmarkPlus size={18} />, onSelect: () => setTemplateFor({ scope: 'dia' }) }] : []),
        ...(!isToday ? [{ label: 'Ir a hoy', icon: <CalendarClock size={18} />, onSelect: () => setDate(isoDate()) }] : []),
      ],
    });
  };

  return (
    <div className="page hoy">
      <header className="hoy__head">
        <div className="hoy__mode">
          <ModeSwitch />
        </div>
        <div className="hoy__row">
        <button className="icon-btn" onClick={() => setDate(addDays(date, -1))} aria-label="Día anterior">
          <ChevronLeft size={26} />
        </button>
        <button className="hoy__date" onClick={() => setDate(isoDate())}>
          <span className="hoy__day">{dayLabel(date)}</span>
          <span className="hoy__full">{fmtDateLong(isoToTs(date))}</span>
        </button>
        <button className="icon-btn" onClick={() => setDate(addDays(date, 1))} aria-label="Día siguiente" disabled={date >= addDays(isoDate(), 7)}>
          <ChevronRight size={26} />
        </button>
        <button className="icon-btn hoy__menu" onClick={dayMenu} aria-label="Opciones del día">
          <MoreHorizontal size={22} />
        </button>
        </div>
      </header>
      <div className="page__scroll hoy__scroll">
        {t && (
          <section className="card summary">
            <KcalRing value={totals.kcal} target={t.kcal} />
            <div className="summary__right">
              <div className="summary__kcal">
                <b>{fmtK(totals.kcal)}</b> / {fmtK(t.kcal)} kcal
              </div>
              <MacroBar kind="p" label="Proteína" value={totals.protein} target={t.protein} />
              <MacroBar kind="c" label="Hidratos" value={totals.carbs} target={t.carbs} />
              <MacroBar kind="f" label="Grasa" value={totals.fat} target={t.fat} />
            </div>
            <div className="summary__foot">
              <span>
                Fibra <b>{fmtK(totals.fiber)}</b>/{t.fiber} g
              </span>
              <span>
                Azúcares <b>{fmtK(totals.sugar)}</b> g
              </span>
              <span>
                Sal <b>{(Math.round(totals.salt * 10) / 10).toString().replace('.', ',')}</b> g
              </span>
            </div>
          </section>
        )}

        {checkInDue && analysis && (
          <div className="hoy__cards">
            <CheckInCard a={analysis} />
          </div>
        )}

        {s.meals.map((m) => (
          <MealSection key={m.id} meal={m} entries={byMeal(m.id)} onAdd={() => setPicker(m.id)} onEdit={(e) => void openEdit(e)} onMenu={() => mealMenu(m.id)} />
        ))}

        <div className="hoy__cards">
          <WaterCard day={day} goalMl={t?.waterMl ?? 2500} />
          <SupplementsCard day={day} supplements={supplements} />
          <WeightCard date={date} />
        </div>
      </div>

      <FoodPicker open={!!picker} onClose={() => setPicker(null)} date={date} meal={picker ?? s.meals[0]?.id ?? 'comida'} meals={s.meals} />
      <QuantitySheet food={editing?.food ?? null} entry={editing?.entry} date={date} meal={editing?.entry.meal ?? ''} meals={s.meals} onClose={() => setEditing(null)} />
      <PromptSheet
        open={!!templateFor}
        title={templateFor?.scope === 'dia' ? 'Nombre del menú' : 'Nombre de la plantilla'}
        placeholder={templateFor?.scope === 'dia' ? 'Ej.: Día de entreno' : 'Ej.: Desayuno de siempre'}
        onClose={() => setTemplateFor(null)}
        onSubmit={async (name) => {
          const list = templateFor?.scope === 'dia' ? entries : byMeal(templateFor?.meal ?? '');
          await saveTemplate(name, list, templateFor?.scope ?? 'comida');
          toast('Plantilla guardada', { tone: 'success' });
        }}
      />
    </div>
  );
}
