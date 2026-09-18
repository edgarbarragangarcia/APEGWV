import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { CartProvider } from './context/CartContext.tsx'
import { NotificationProvider } from './context/NotificationContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'

// Limpiar Service Workers de otros proyectos en localhost.
// Solo en desarrollo: en producción el service worker de la PWA debe quedarse activo.
if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <ToastProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ToastProvider>
    </NotificationProvider>
  </StrictMode>,
)
