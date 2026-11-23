import { useEffect, useRef } from 'react';
import { BellRing, ChevronUp, Timer } from 'lucide-react';
import { useGym } from '../store';
import { useNow } from './useNow';
import { beep } from '../../lib/sound';
import { toast } from '../../ui/uiStore';
import { DAY } from '../program';
import { progress } from './cursor';

const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, Math.round(sec % 60))).padStart(2, '0')}`;

/** Avisa al terminar el descanso (sonido y destello) y pasa a la siguiente serie. */
export function GymRestWatcher() {
  const rest = useGym((x) => x.session?.rest);
  const now = useNow(!!rest, 250);
  const fired = useRef<number | null>(null);
  useEffect(() => {
    if (!rest || now < rest.endsAt || fired.current === rest.endsAt) return;
    fired.current = rest.endsAt;
    const late = now - rest.endsAt > 5000;
    if (!late) {
      beep();
      document.documentElement.classList.add('rest-flash');
      setTimeout(() => document.documentElement.classList.remove('rest-flash'), 900);
      toast('¡A por la siguiente serie!', { tone: 'accent', icon: <BellRing size={18} /> });
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
