import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { initializeData } from './utils/dataInitializer';

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:2rem;font-family:system-ui;color:#c62828;">Error: no se encontró el elemento root.</div>';
} else {
  try {
    const root = ReactDOM.createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    // Después del primer paint: poblar localStorage sin bloquear el arranque de React
    const runInitData = () => {
      try {
        initializeData();
      } catch (e) {
        console.error('initData:', e);
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runInitData, { once: true });
    } else {
      queueMicrotask(runInitData);
    }
  } catch (err) {
    console.error('Error al montar la aplicación:', err);
    rootEl.innerHTML = `<div style="padding:2rem;font-family:system-ui;color:#272F50;max-width:480px;">
      <p style="color:#c62828;font-weight:600;">Error al cargar la aplicación</p>
      <p style="margin-top:0.5rem;font-size:0.9rem;">${err?.message || String(err)}</p>
      <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;background:#085946;color:#fff;border:none;border-radius:4px;cursor:pointer;">Reintentar</button>
    </div>`;
  }
}
