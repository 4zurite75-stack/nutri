import { useEffect, useRef } from 'react';
import { Pill } from 'lucide-react';
import { useSupplements, useDay } from '../../db/hooks';
import { updateDay } from '../../db/actions';
import { isoDate } from '../../lib/format';
import { reminderList } from '../../lib/ics';
import { beep } from '../../lib/alarm';
import { toast } from '../../ui/uiStore';

const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Si la app está abierta a la hora de un aviso y el suplemento no está marcado, lo recuerda con un aviso para marcarlo. */
export function SuppReminderWatcher() {
  const supps = useSupplements();
  const today = isoDate();
  const day = useDay(today);
  const shown = useRef(new Set<string>());
  const latest = useRef({ supps, day });
  latest.current = { supps, day };

  useEffect(() => {
    const check = () => {
      const { supps, day } = latest.current;
      if (!supps) return;
      const now = new Date();
      const date = isoDate();
      const cur = hm(now);
      const past = hm(new Date(now.getTime() - 30 * 60000));
      for (const { supp, time } of reminderList(supps)) {
        const key = `${date}-${supp.id}-${time}`;
        // Ventana de 30 min tras la hora (por si abres la app un poco después).
        const inWindow = past <= cur ? time <= cur && time > past : time <= cur || time > past;
        if (!inWindow || shown.current.has(key)) continue;
        shown.current.add(key);
        if (day.date === date && day.supplements?.[supp.id]) continue;
        beep(3, 880);
        toast(`Hora de tomar: ${supp.name}`, {
          tone: 'accent',
          icon: <Pill size={18} />,
          duration: 20000,
          action: {
            label: 'Tomada',
            onClick: () =>
              void updateDay(date, (d) => {
                d.supplements = { ...(d.supplements ?? {}), [supp.id]: Date.now() };
              }),
          },
        });
      }
    };
    // Primera comprobación con un margen para que carguen los datos del día.
    const first = window.setTimeout(check, 2500);
    const t = window.setInterval(check, 20000);
    const vis = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);
  return null;
}
