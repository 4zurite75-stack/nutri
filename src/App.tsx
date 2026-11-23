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
import { GymHoy } from './gym/screens/GymHoy';
import { ProgramPage } from './gym/screens/ProgramPage';
import { GymHistory } from './gym/screens/GymHistory';
import { GymProgress } from './gym/screens/GymProgress';
import { Runner } from './gym/runner/Runner';
import { GymMiniBar, GymRestWatcher, RestAlarm } from './gym/runner/GymOverlays';
import { useGym } from './gym/store';
import { ErrorBoundary } from './ui/ErrorBoundary';

function hideLaunch() {
  const el = document.getElementById('launch');
  if (!el) return;
  requestAnimationFrame(() => el.classList.add('is-hidden'));
  setTimeout(() => el.remove(), 450);
}

export function App() {
  const s = useSettings();
  const hasSession = useGym((x) => !!x.session);
  useEffect(() => {
    if (!s.loading) hideLaunch();
  }, [s.loading]);
  useEffect(() => {
    void useGym.getState().load();
  }, []);

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
    <div className={`app ${hasSession ? 'has-minibar' : ''}`}>
      <main className="tabviews">
        <TabView tab="g-hoy" root={<GymHoy />} />
        <TabView tab="g-programa" root={<ProgramPage />} />
        <TabView tab="g-historial" root={<GymHistory />} />
        <TabView tab="g-progreso" root={<GymProgress />} />
        <TabView tab="hoy" root={<HoyHome />} />
        <TabView tab="alimentos" root={<AlimentosHome />} />
        <TabView tab="progreso" root={<ProgresoHome />} />
        <TabView tab="ajustes" root={<AjustesHome />} />
      </main>
      <GymMiniBar />
      <TabBar />
      <ErrorBoundary>
        <Runner />
      </ErrorBoundary>
      <GymRestWatcher />
      <RestAlarm />
      <Overlays />
    </div>
  );
}
