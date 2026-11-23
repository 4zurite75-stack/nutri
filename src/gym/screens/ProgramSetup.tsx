import { useState } from 'react';
import { CalendarRange, Dumbbell, Target, TrendingUp } from 'lucide-react';
import { setSetting } from '../../state/settings';
import type { ProgramConfig } from '../types';
import { mondayOf } from '../program';
import { NumField, parseNum } from '../../ui/fields';
import { isoDate, fmtKg } from '../../lib/format';
import { toast } from '../../ui/uiStore';

export function defaultConfig(weight?: number): ProgramConfig {
  return { startDate: mondayOf(isoDate()), bodyWeight: weight ? Math.round(weight) : 70, rounding: 2.5, tmPct: 0.9, barWeight: 20, manual1RM: {} };
}

/** Datos del programa: se usa al empezar y desde Ajustes del programa. */
export function ProgramFields({ cfg, onChange }: { cfg: ProgramConfig; onChange: (c: ProgramConfig) => void }) {
  return (
    <div className="form">
      <label className="field">
        <span className="field__label">Inicio (lunes de la semana 1)</span>
        <input
          className="input"
          type="date"
          value={cfg.startDate}
          onChange={(e) => e.target.value && onChange({ ...cfg, startDate: mondayOf(e.target.value) })}
        />
      </label>
      <div className="numfield-grid">
        <NumField
          label="Peso corporal"
          hint="para dominadas"
          value={fmtKg(cfg.bodyWeight)}
          unit="kg"
          onChange={(v) => onChange({ ...cfg, bodyWeight: parseNum(v) ?? cfg.bodyWeight })}
        />
        <NumField label="Barra" value={fmtKg(cfg.barWeight)} unit="kg" onChange={(v) => onChange({ ...cfg, barWeight: parseNum(v) ?? cfg.barWeight })} />
      </div>
      <p className="hint" style={{ marginTop: -8 }}>
        El peso corporal solo sirve para calcular la carga de las dominadas (en ellas solo apuntas el lastre). Actualízalo aquí si cambia
        bastante.
      </p>
    </div>
  );
}

export function ProgramSetup({ suggestedWeight }: { suggestedWeight?: number }) {
  const [cfg, setCfg] = useState(() => defaultConfig(suggestedWeight));
  const start = async () => {
    if (cfg.bodyWeight < 30 || cfg.bodyWeight > 250) return toast('Revisa el peso corporal');
    await setSetting('program', cfg);
    toast('¡Programa activado!', { tone: 'success' });
  };
  return (
    <div className="psetup">
      <div className="psetup__hero">
        <div className="psetup__icon">
          <Dumbbell size={34} />
        </div>
        <h2>Torso · Pierna · Full Body</h2>
        <p className="muted">17 semanas de periodización por olas. Tú haces las series y apuntas los resultados; la app calcula todo lo demás.</p>
      </div>
      <div className="psetup__points">
        <div>
          <Target size={18} /> <span><b>Semana 1:</b> calibración para encontrar tu 1RM en los 6 ejercicios principales.</span>
        </div>
        <div>
          <CalendarRange size={18} /> <span><b>4 olas</b> de 10, 8, 5 y 3 repeticiones con semana de descarga. Lunes, miércoles y viernes.</span>
        </div>
        <div>
          <TrendingUp size={18} /> <span><b>Progresión automática:</b> el Training Max sube según tus AMRAP y los accesorios según tus repeticiones.</span>
        </div>
      </div>
      <ProgramFields cfg={cfg} onChange={setCfg} />
      <div className="form" style={{ marginTop: 16 }}>
        <button className="btn btn--primary btn--block btn--lg" onClick={() => void start()}>
          Empezar programa
        </button>
      </div>
    </div>
  );
}
