import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { db, requestPersistence } from './db/db';
import './styles/base.css';
import './styles/components.css';
import './styles/reuse.css';
import './styles/app.css';
import './styles/cat.css';

// Para pruebas en navegador de escritorio: simula notch y barra inferior de iPhone.
if (new URLSearchParams(location.search).has('sim')) document.documentElement.classList.add('sim-iphone');

void requestPersistence();

// Solo en desarrollo: acceso a la base de datos para las pruebas automáticas.
if (import.meta.env.DEV) (window as unknown as { __db: typeof db }).__db = db;

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
