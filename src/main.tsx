import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { db, requestPersistence } from './db/db';
import './styles/base.css';
import './styles/components.css';
import './styles/reuse.css';
import './styles/app.css';
import './styles/cat.css';
import './styles/gym.css';

// Para pruebas en navegador de escritorio: simula notch y barra inferior de iPhone.
if (new URLSearchParams(location.search).has('sim')) document.documentElement.classList.add('sim-iphone');

void requestPersistence();

// Solo en desarrollo: acceso a la base de datos para las pruebas automáticas.
if (import.meta.env.DEV) (window as unknown as { __db: typeof db }).__db = db;

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) =>
    registerSW({
      immediate: true,
      // iOS apenas busca versiones nuevas en las apps instaladas: se comprueba al abrir, al volver a la app y cada 30 min.
      onRegisteredSW(_url, r) {
        if (!r) return;
        const check = () => void r.update().catch(() => {});
        check();
        setInterval(check, 30 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check();
        });
      },
    }),
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
