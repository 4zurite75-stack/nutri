import { useState } from 'react';
import { ClipboardPaste, Footprints, HelpCircle, Pencil } from 'lucide-react';
import { useDay } from '../../db/hooks';
import { updateDay } from '../../db/actions';
import { useSettings } from '../../state/settings';
import { fmtK, isoDate } from '../../lib/format';
import { PromptSheet } from '../../ui/PromptSheet';
import { Sheet, SheetHeader } from '../../ui/Sheet';
import { toast } from '../../ui/uiStore';

/** Convierte lo que copia el Atajo («8432», «8.432», «8432,0») en un número de pasos. */
export function parseSteps(text: string): number | null {
  const t = text.trim().replace(/[.,]\d{1,2}$/, '');
  const digits = t.replace(/\D/g, '');
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return n >= 0 && n < 200000 ? n : null;
}

export function StepsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader
        title="Pasos de Apple Salud"
        right={
          <button className="link-btn is-bold" onClick={onClose}>
            Listo
          </button>
        }
      />
      <div className="sheet-scroll install">
        <p className="muted" style={{ marginTop: 0 }}>
          Las apps web no pueden leer Salud directamente. Con un Atajo de iOS copias los pasos de hoy en un toque y aquí los pegas.
        </p>
        <ol>
          <li>
            Abre la app <b>Atajos</b> y pulsa <b>+</b>.
          </li>
          <li>
            Añade <b>Buscar muestras de salud</b>: Tipo <b>Pasos</b>, Fecha de inicio <b>es hoy</b>, Agrupar por <b>Día</b>.
          </li>
          <li>
            Añade <b>Obtener detalles de muestras de salud</b> → <b>Valor</b>.
          </li>
          <li>
            Añade <b>Copiar en el portapapeles</b>.
          </li>
          <li>
            Llámalo «Pasos para Físico» y ponlo en la pantalla de inicio o como widget (o pídeselo a Siri).
          </li>
          <li>
            Ejecútalo, abre Físico y pulsa <b>Pegar de Salud</b>.
          </li>
        </ol>
        <p className="hint">Los nombres de las acciones pueden variar un poco según tu versión de iOS. La primera vez te pedirá permiso para leer Salud.</p>
      </div>
    </Sheet>
  );
}

export function StepsCard() {
  const date = isoDate();
  const day = useDay(date);
  const { stepsGoal } = useSettings();
  const [manual, setManual] = useState(false);
  const [help, setHelp] = useState(false);
  const steps = day.steps ?? 0;
  const pct = Math.min(1, steps / Math.max(1, stepsGoal));

  const save = (n: number) =>
    void updateDay(date, (d) => {
      d.steps = n;
    }).then(() => toast(`${fmtK(n)} pasos guardados`, { tone: 'success', duration: 1600 }));

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const n = parseSteps(text);
      if (n == null) return toast('El portapapeles no tiene un número de pasos. Ejecuta antes el Atajo.', { duration: 3500 });
      save(n);
    } catch {
      toast('No se pudo leer el portapapeles. Escríbelos a mano.');
      setManual(true);
    }
  };

  return (
    <section className="card steps">
      <div className="card__head">
        <span className="card__icon card__icon--steps">
          <Footprints size={18} />
        </span>
        <span className="card__title">Pasos</span>
        <span className="card__value">
          <b>{fmtK(steps)}</b> / {fmtK(stepsGoal)}
        </span>
      </div>
      <div className="water__bar">
        <span className="steps__fill" style={{ transform: `scaleX(${pct})` }} />
      </div>
      <div className="steps__btns">
        <button className="water__btn steps__btn" onClick={() => void paste()}>
          <ClipboardPaste size={16} /> Pegar de Salud
        </button>
        <button className="water__btn steps__btn" onClick={() => setManual(true)} aria-label="Escribir pasos">
          <Pencil size={16} />
        </button>
        <button className="water__btn steps__btn" onClick={() => setHelp(true)} aria-label="Cómo conectarlo con Salud">
          <HelpCircle size={16} />
        </button>
      </div>
      <PromptSheet
        open={manual}
        title="Pasos de hoy"
        placeholder="8432"
        inputMode="numeric"
        initial={steps ? String(steps) : ''}
        onClose={() => setManual(false)}
        onSubmit={(v) => {
          const n = parseSteps(v);
          if (n != null) save(n);
        }}
      />
      <StepsHelp open={help} onClose={() => setHelp(false)} />
    </section>
  );
}
