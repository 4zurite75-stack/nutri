import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { intakeByDate } from '../../db/actions';
import { addDays, isoDate } from '../../lib/format';
import { computePet, scoreDay, type DayInput, type DayScore, type PetState } from '../../lib/pet';
import type { Targets } from '../../db/types';
import type { GymSession, ProgramConfig } from '../../gym/types';
import { scheduledOn } from '../../gym/program';

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
  today: { input: DayInput; result: DayScore; targets: Targets; pendingSupps: string[]; gym: 'done' | 'pending' | null };
}

/** Días que se recalculan por si se registran tarde (ayer y anteayer). Los anteriores quedan cerrados. */
const OPEN_DAYS = 3;

export function usePet(): PetView | null | undefined {
  const data = useLiveQuery(async () => {
    const [petRow, targetsRow, intake, days, weights, supps, programRow, gymSessions] = await Promise.all([
      db.settings.get('pet'),
      db.settings.get('targets'),
      intakeByDate(),
      db.days.toArray(),
      db.weights.toArray(),
      db.supplements.toArray(),
      db.settings.get('program'),
      db.gymSessions.toArray(),
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
    // Días de gym programados: hecho o saltado (solo días cerrados).
    const program = programRow?.value as ProgramConfig | null | undefined;
    const gym: Record<string, 'done' | 'missed'> = {};
    const doneKey = new Set((gymSessions as GymSession[]).filter((g) => g.status === 'done').map((g) => `${g.week}-${g.dayId}`));
    let gymToday: 'done' | 'pending' | null = null;
    if (program) {
      for (let d = pet.startDate < program.startDate ? program.startDate : pet.startDate; d <= today; d = addDays(d, 1)) {
        const sc = scheduledOn(program, d);
        if (!sc) continue;
        const ok = doneKey.has(`${sc.week}-${sc.day}`);
        if (d === today) gymToday = ok ? 'done' : 'pending';
        else gym[d] = ok ? 'done' : 'missed';
      }
    }
    const todayInput = input(today);
    const view: PetView = {
      pet: { ...pet, scores },
      state: computePet(pet.startDate, scores, today, gym),
      today: {
        input: todayInput,
        result: scoreDay(todayInput, targets),
        targets,
        pendingSupps: active.filter((s) => !dayMap.get(today)?.supplements?.[s.id]).map((s) => s.name),
        gym: gymToday,
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
