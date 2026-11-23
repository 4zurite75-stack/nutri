import { useEffect, useRef } from 'react';
import { BellRing, ChevronUp, Timer } from 'lucide-react';
import { useGym } from '../store';
import { useNow } from './useNow';
import { startAlarm, stopAlarm } from '../../lib/alarm';
import { create } from 'zustand';
import { toast } from '../../ui/uiStore';
import { DAY } from '../program';
import { progress } from './cursor';

const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, Math.round(sec % 60))).padStart(2, '0')}`;

const useAlarm = create<{ on: boolean }>(() => ({ on: false }));

/** Aviso a pantalla completa al acabar el descanso: suena y vibra hasta que lo paras. */
export function RestAlarm() {
  const on = useAlarm((x) => x.on);
  const session = useGym((x) => x.session);
  if (!on) return null;
  const close = () => {
    stopAlarm();
    useAlarm.setState({ on: false });
    useGym.getState().setExpanded(true);
  };
  const e = session ? session.exercises[session.cursor.ex] : null;
  return (
    <div className="ralarm" onClick={close} role="alertdialog">
      <BellRing size={64} className="ralarm__bell" />
      <h2>¡Descanso terminado!</h2>
      {e && <p>Siguiente: {e.name}</p>}
      <button className="ralarm__btn" onClick={close}>
        Vamos
      </button>
    </div>
  );
}

/** Avisa al terminar el descanso (sonido, vibración y aviso) y pasa a la siguiente serie. */
export function GymRestWatcher() {
  const rest = useGym((x) => x.session?.rest);
  const now = useNow(!!rest, 250);
  const fired = useRef<number | null>(null);
  useEffect(() => {
    if (!rest || now < rest.endsAt || fired.current === rest.endsAt) return;
    fired.current = rest.endsAt;
    const late = now - rest.endsAt > 5000;
    if (!late) {
      startAlarm(15);
      useAlarm.setState({ on: true });
    } else {
      toast('El descanso ya terminó: ¡a por la siguiente serie!', { tone: 'accent', icon: <BellRing size={18} /> });
    }
    useGym.getState().mutate((x) => {
      if (x.rest?.endsAt === rest.endsAt) x.rest = null;
    });
  }, [now, rest]);
  return null;
}

export function GymMiniBar() {
  const session = useGym((x) => x.session);
  const expanded = useGym((x) => x.expanded);
  const now = useNow(!!session && !expanded, 500);
  const show = !!session && !expanded;
  const rest = session?.rest && session.rest.endsAt > now ? (session.rest.endsAt - now) / 1000 : null;
  const p = session ? progress(session) : { done: 0, total: 0 };
  return (
    <button className={`minibar ${show ? 'is-visible' : ''}`} onClick={() => useGym.getState().setExpanded(true)} tabIndex={show ? 0 : -1}>
      <span className="minibar__pulse" />
      <span className="minibar__text">
        <span className="minibar__name">{session ? DAY(session.dayId).name : ''}</span>
        <span className="minibar__time">
          {p.done}/{p.total} series
        </span>
      </span>
      {rest != null && (
        <span className="minibar__rest">
          <Timer size={15} /> {clock(Math.ceil(rest))}
        </span>
      )}
      <ChevronUp size={20} />
    </button>
  );
}
