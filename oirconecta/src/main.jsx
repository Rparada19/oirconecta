import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeData } from './utils/dataInitializer';

// Inicializar datos cuando el DOM esté listo
const initApp = () => {
  // Esperar a que el DOM esté completamente cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeData();
    });
  } else {
    // El DOM ya está listo
    initializeData();
  }
};

// Inicializar la aplicación
initApp();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
