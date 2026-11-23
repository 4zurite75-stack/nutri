import { ArrowUpRight, Equal, Target, Trophy } from 'lucide-react';
import type { GymSession, ProgramConfig } from '../types';
import { DAY, accessoryTarget, oneRM, trainingMaxes, weekInfo, WAVES, fmtLoad, epley, liftDef } from '../program';
import { fmtKg } from '../../lib/format';

interface Row {
  name: string;
  icon: 'trophy' | 'up' | 'same' | 'target';
  main: string;
  sub?: string;
}

/** Qué ha cambiado tras una sesión: 1RM y TM calibrados, efecto del AMRAP y peso de los accesorios para la próxima vez. */
export function sessionResults(session: GymSession, all: GymSession[], cfg: ProgramConfig): Row[] {
  const rows: Row[] = [];
  const info = weekInfo(session.week);
  const upTo = all.filter((x) => x.id !== session.id).concat(session);
  for (const e of session.exercises) {
    const done = e.sets.filter((s) => s.done);
    if (!done.length) continue;
    if (e.lift) {
      const top = e.sets.find((s) => s.kind === 'top' && s.done);
      if (top) {
        const rm = oneRM(e.lift, upTo, cfg);
        const tm = trainingMaxes(e.lift, upTo, cfg)[0];
        rows.push({
          name: e.name,
          icon: 'trophy',
          main: `1RM ${fmtKg(rm?.value ?? 0)} kg · TM ${fmtKg(tm ?? 0)} kg`,
          sub: `Serie top: ${fmtLoad(top.weight, e.bodyweight)} × ${top.reps} @ RIR ${top.rir ?? 2}`,
        });
        continue;
      }
      const amrap = e.sets.find((s) => s.kind === 'amrap' && s.done);
      if (amrap && info.wave != null) {
        const w = info.wave;
        const tms = trainingMaxes(e.lift, upTo, cfg);
        const extra = Math.max(0, Math.min((amrap.reps ?? 0) - WAVES[w].reps, 10));
        rows.push({
          name: e.name,
          icon: extra > 0 ? 'up' : 'same',
          main: `AMRAP: ${amrap.reps} reps con ${fmtLoad(amrap.weight, e.bodyweight)}`,
          sub: `Training Max ${fmtKg(tms[w] ?? 0)} → ${fmtKg(tms[w + 1] ?? 0)} kg (${extra > 0 ? `+${fmtKg(extra * liftDef(e.lift).inc)} kg` : 'sin cambio'})`,
        });
        continue;
      }
      const plus = e.sets.find((s) => s.kind === 'plus' && s.done);
      if (plus) {
        const load = (e.bodyweight ? cfg.bodyWeight : 0) + (plus.weight ?? 0);
        rows.push({ name: e.name, icon: 'target', main: `Serie «+»: ${plus.reps} reps con ${fmtLoad(plus.weight, e.bodyweight)}`, sub: `1RM estimado ese día: ${fmtKg(epley(load, plus.reps ?? 0, 1))} kg` });
        continue;
      }
      rows.push({ name: e.name, icon: 'same', main: `${done.length} series hechas` });
    } else {
      const def = DAY(session.dayId).exercises.find((x) => x.id === e.exId)!;
      const next = accessoryTarget(def, session.week + 1, upTo);
      const reps = done.map((s) => s.reps).join(', ');
      if (!next) continue;
      rows.push({
        name: e.name,
        icon: next.reason === 'sube' && info.phase !== 'descarga' ? 'up' : 'same',
        main: `${fmtLoad(Math.max(...done.map((s) => s.weight ?? 0)), e.bodyweight)} · reps ${reps}`,
        sub: next.reason === 'sube' ? `Próxima vez: ${fmtLoad(next.weight, e.bodyweight)} (llegaste al tope en todas)` : `Próxima vez: ${fmtLoad(next.weight, e.bodyweight)} hasta llegar a ${def.repMax} en todas`,
      });
    }
  }
  return rows;
}

export function ResultsList({ rows }: { rows: Row[] }) {
  return (
    <div className="group results">
      {rows.map((r, i) => (
        <div key={i} className="group__row results__row">
          <span className={`results__icon is-${r.icon}`}>
            {r.icon === 'trophy' ? <Trophy size={16} /> : r.icon === 'up' ? <ArrowUpRight size={16} /> : r.icon === 'target' ? <Target size={16} /> : <Equal size={16} />}
          </span>
          <span className="results__text">
            <b>{r.name}</b>
            <span>{r.main}</span>
            {r.sub && <small className="muted">{r.sub}</small>}
          </span>
        </div>
      ))}
    </div>
  );
}
