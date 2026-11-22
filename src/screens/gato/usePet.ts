import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { intakeByDate } from '../../db/actions';
import { addDays, isoDate } from '../../lib/format';
import { computePet, scoreDay, type DayInput, type DayScore, type PetState } from '../../lib/pet';
import type { Targets } from '../../db/types';

export interface PetData {
  name: string;
  startDate: string;
  /** Puntuación de cada día cerrado. */
  scores: Record<string, number>;
  /** Última etapa celebrada (para el aviso de evolución). */
  lastStage: number;
}

export interface PetView {
  pet: PetData;
  state: PetState;
  today: { input: DayInput; result: DayScore; targets: Targets; pendingSupps: string[] };
}

/** Días que se recalculan por si se registran tarde (ayer y anteayer). Los anteriores quedan cerrados. */
const OPEN_DAYS = 3;

export function usePet(): PetView | null | undefined {
  const data = useLiveQuery(async () => {
    const [petRow, targetsRow, intake, days, weights, supps] = await Promise.all([
      db.settings.get('pet'),
      db.settings.get('targets'),
      intakeByDate(),
      db.days.toArray(),
      db.weights.toArray(),
      db.supplements.toArray(),
    ]);
    const targets = targetsRow?.value as Targets | undefined;
    if (!targets) return null;
    const today = isoDate();
    const pet = (petRow?.value as PetData | undefined) ?? { name: 'Michi', startDate: today, scores: {}, lastStage: 0, isNew: true };
    const dayMap = new Map(days.map((d) => [d.date, d]));
    const weighed = new Set(weights.map((w) => w.date));
    const active = supps.filter((s) => s.active);
    const input = (date: string): DayInput => {
      const d = dayMap.get(date);
      return {
        kcal: intake.get(date)?.kcal ?? 0,
        protein: intake.get(date)?.protein ?? 0,
        waterMl: d?.waterMl ?? 0,
        suppsTaken: active.filter((s) => d?.supplements?.[s.id]).length,
        suppsTotal: active.length,
        weighed: weighed.has(date),
      };
    };
    const scores = { ...pet.scores };
    let changed = false;
    const openFrom = addDays(today, -OPEN_DAYS);
    // Se calculan los días que faltan y se recalculan los últimos (por si se registró tarde).
    for (let d = pet.startDate; d < today; d = addDays(d, 1)) {
      if (d in scores && d < openFrom) continue;
      const sc = scoreDay(input(d), targets).score;
      if (scores[d] !== sc) {
        scores[d] = sc;
        changed = true;
      }
    }
    const todayInput = input(today);
    const view: PetView = {
      pet: { ...pet, scores },
      state: computePet(pet.startDate, scores, today),
      today: {
        input: todayInput,
        result: scoreDay(todayInput, targets),
        targets,
        pendingSupps: active.filter((s) => !dayMap.get(today)?.supplements?.[s.id]).map((s) => s.name),
      },
    };
    return { view, save: changed || 'isNew' in pet ? { name: pet.name, startDate: pet.startDate, scores, lastStage: pet.lastStage } : null };
  }, []);

  useEffect(() => {
    if (data?.save) void db.settings.put({ key: 'pet', value: data.save });
  }, [data]);

  if (data === undefined) return undefined;
  return data?.view ?? null;
}

export async function updatePet(patch: Partial<PetData>) {
  const row = await db.settings.get('pet');
  if (!row) return;
  await db.settings.put({ key: 'pet', value: { ...(row.value as PetData), ...patch } });
}
