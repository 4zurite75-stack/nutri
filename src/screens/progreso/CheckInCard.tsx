import { ArrowDownRight, ArrowUpRight, CheckCircle2, Hourglass, Target } from 'lucide-react';
import type { Analysis } from '../../lib/adaptive';
import { targetsForKcal } from '../../lib/adaptive';
import { fmtK, fmtKg, isoDate } from '../../lib/format';
import { getSettings, setSetting, useSettings } from '../../state/settings';
import { db } from '../../db/db';
import { uid } from '../../lib/id';
import { toast } from '../../ui/uiStore';

export async function applyRecommendation(a: Analysis) {
  const s = await getSettings();
  if (!s.profile || !s.targets) return;
  const t = targetsForKcal(s.profile, a.currentWeight, a.recommendedKcal, a.tdee, 'adaptativo');
  await db.checkins.put({
    id: uid(),
    date: isoDate(),
    estTdee: a.tdee,
    ratePct: a.actualRatePct ?? 0,
    fromKcal: s.targets.kcal,
    toKcal: t.kcal,
    applied: true,
    createdAt: Date.now(),
  });
  await setSetting('targets', t);
  await setSetting('lastCheckInAt', Date.now());
  toast(`Nuevo objetivo: ${fmtK(t.kcal)} kcal`, { tone: 'success' });
}

export async function dismissCheckIn(a: Analysis) {
  const s = await getSettings();
  await db.checkins.put({
    id: uid(),
    date: isoDate(),
    estTdee: a.tdee,
    ratePct: a.actualRatePct ?? 0,
    fromKcal: s.targets?.kcal ?? 0,
    toKcal: s.targets?.kcal ?? 0,
    applied: false,
    createdAt: Date.now(),
  });
  await setSetting('lastCheckInAt', Date.now());
}

export function CheckInCard({ a, compact }: { a: Analysis; compact?: boolean }) {
  const s = useSettings();
  const Icon = a.verdict === 'datos' ? Hourglass : a.verdict === 'en_objetivo' ? CheckCircle2 : a.change > 0 ? ArrowUpRight : a.change < 0 ? ArrowDownRight : Target;
  const tone = a.verdict === 'datos' ? 'muted' : a.verdict === 'en_objetivo' ? 'good' : 'warn';
  return (
    <section className={`card checkin checkin--${tone}`}>
      <div className="checkin__head">
        <span className="checkin__icon">
          <Icon size={20} />
        </span>
        <div>
          <div className="checkin__kicker">Revisión semanal</div>
          <div className="checkin__title">{a.title}</div>
        </div>
      </div>
      <p className="checkin__msg">{a.message}</p>
      {a.verdict !== 'datos' && (
        <div className="checkin__stats">
          <div>
            <span>Mantenimiento real</span>
            <b>{fmtK(a.tdee)} kcal</b>
          </div>
          <div>
            <span>Ingesta media</span>
            <b>{a.avgIntake ? `${fmtK(a.avgIntake)} kcal` : '—'}</b>
          </div>
          <div>
            <span>Fiabilidad</span>
            <b>{Math.round(a.confidence * 100)} %</b>
          </div>
        </div>
      )}
      {a.verdict !== 'datos' && a.change !== 0 && (
        <>
          <p className="checkin__rec">
            Con tu mantenimiento real ({fmtK(a.tdee)} kcal), para ir al ritmo objetivo ({s.profile ? `${s.profile.ratePct > 0 ? '+' : ''}${fmtKg(s.profile.ratePct)}` : ''} %/sem)
            necesitas unas <b>{fmtK(a.recommendedKcal)} kcal</b>. Propuesta: cambiar tu objetivo de {fmtK(s.targets?.kcal ?? 0)} a{' '}
            {fmtK(a.recommendedKcal)} kcal ({a.change > 0 ? '+' : '−'}
            {fmtK(Math.abs(a.change))}). La proteína se mantiene y se recalculan hidratos y grasa.
          </p>
          <div className="checkin__btns">
            <button className="btn btn--primary" onClick={() => void applyRecommendation(a)}>
              Aplicar
            </button>
            {!compact && (
              <button className="btn btn--tinted" onClick={() => void dismissCheckIn(a)}>
                Ahora no
              </button>
            )}
          </div>
        </>
      )}
      {a.verdict !== 'datos' && a.change === 0 && !compact && (
        <div className="checkin__btns">
          <button className="btn btn--tinted" onClick={() => void dismissCheckIn(a)}>
            Entendido, sigo igual
          </button>
        </div>
      )}
      {a.verdict === 'datos' && (
        <p className="hint" style={{ marginTop: 6 }}>
          {a.days > 0 ? `Llevas ${a.loggedDays} días registrados en los últimos ${a.days}.` : ''} Peso actual (tendencia):{' '}
          {fmtKg(Math.round(a.currentWeight * 10) / 10)} kg.
        </p>
      )}
    </section>
  );
}
