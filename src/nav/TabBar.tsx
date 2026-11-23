import { Apple, CalendarDays, CalendarRange, ChartLine, Clock3, Dumbbell, Settings } from 'lucide-react';
import { MODE_TABS, useNav, type Tab } from './nav';

const META: Record<Tab, { label: string; icon: typeof Apple }> = {
  hoy: { label: 'Hoy', icon: CalendarDays },
  alimentos: { label: 'Alimentos', icon: Apple },
  progreso: { label: 'Progreso', icon: ChartLine },
  ajustes: { label: 'Ajustes', icon: Settings },
  'g-hoy': { label: 'Hoy', icon: Dumbbell },
  'g-programa': { label: 'Programa', icon: CalendarRange },
  'g-historial': { label: 'Historial', icon: Clock3 },
  'g-progreso': { label: 'Progreso', icon: ChartLine },
};

export function TabBar() {
  const mode = useNav((s) => s.mode);
  const tab = useNav((s) => s.tab);
  const setTab = useNav((s) => s.setTab);
  const tabs = MODE_TABS[mode];
  return (
    <nav className="tabbar" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((id) => {
        const { label, icon: Icon } = META[id];
        return (
          <button key={id} className={`tabbar__item ${tab === id ? 'is-active' : ''}`} onClick={() => setTab(id)}>
            <Icon size={25} strokeWidth={tab === id ? 2.3 : 1.9} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
