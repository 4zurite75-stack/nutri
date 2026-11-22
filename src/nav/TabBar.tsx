import { Apple, CalendarDays, ChartLine, Settings } from 'lucide-react';
import { useNav, type Tab } from './nav';

const TABS: { id: Tab; label: string; icon: typeof Apple }[] = [
  { id: 'hoy', label: 'Hoy', icon: CalendarDays },
  { id: 'alimentos', label: 'Alimentos', icon: Apple },
  { id: 'progreso', label: 'Progreso', icon: ChartLine },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
];

export function TabBar() {
  const tab = useNav((s) => s.tab);
  const setTab = useNav((s) => s.setTab);
  return (
    <nav className="tabbar">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button key={id} className={`tabbar__item ${tab === id ? 'is-active' : ''}`} onClick={() => setTab(id)}>
          <Icon size={25} strokeWidth={tab === id ? 2.3 : 1.9} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
