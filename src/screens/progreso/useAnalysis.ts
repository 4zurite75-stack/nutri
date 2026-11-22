import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { intakeByDate } from '../../db/actions';
import { analyze, type Analysis } from '../../lib/adaptive';
import { getSettings } from '../../state/settings';

export function useAnalysis(): Analysis | null | undefined {
  return useLiveQuery(async () => {
    const s = await getSettings();
    if (!s.profile || !s.targets) return null;
    const [weights, intake] = await Promise.all([db.weights.toArray(), intakeByDate()]);
    const kcalMap = new Map([...intake.entries()].map(([d, v]) => [d, v.kcal]));
    return analyze(s.profile, s.targets, weights, kcalMap);
  }, []);
}
