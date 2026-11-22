import { useEffect } from 'react';
import { TabBar } from './nav/TabBar';
import { TabView } from './nav/TabView';
import { Overlays } from './ui/Overlays';
import { HoyHome } from './screens/hoy/HoyHome';
import { AlimentosHome } from './screens/alimentos/AlimentosHome';
import { ProgresoHome } from './screens/progreso/ProgresoHome';
import { AjustesHome } from './screens/ajustes/AjustesHome';
import { Onboarding } from './screens/onboarding/Onboarding';
import { useSettings } from './state/settings';

function hideLaunch() {
  const el = document.getElementById('launch');
  if (!el) return;
  requestAnimationFrame(() => el.classList.add('is-hidden'));
  setTimeout(() => el.remove(), 450);
}

export function App() {
  const s = useSettings();
  useEffect(() => {
    if (!s.loading) hideLaunch();
  }, [s.loading]);

  if (s.loading) return null;
  if (!s.profile || !s.targets) {
    return (
      <>
        <Onboarding />
        <Overlays />
      </>
    );
  }
  return (
    <div className="app">
      <main className="tabviews">
        <TabView tab="hoy" root={<HoyHome />} />
        <TabView tab="alimentos" root={<AlimentosHome />} />
        <TabView tab="progreso" root={<ProgresoHome />} />
        <TabView tab="ajustes" root={<AjustesHome />} />
      </main>
      <TabBar />
      <Overlays />
    </div>
  );
}
