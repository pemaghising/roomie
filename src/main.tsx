import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { registerSW } from 'virtual:pwa-register';
import './styles/tokens.css';
import './styles/base.css';
import './ui/ui.css';
import App from './App';
import { persister, queryClient } from './lib/queryClient';
import { AuthProvider } from './features/auth/AuthProvider';
import { ToastProvider } from './ui/Toast';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24, buster: 'v1' }}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
);
