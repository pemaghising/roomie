import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { domMax, LazyMotion } from 'motion/react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { registerSW } from 'virtual:pwa-register';
import './styles/tokens.css';
import './styles/base.css';
import './ui/ui.css';
import App from './App';
import { persister, queryClient } from './lib/queryClient';
import { AuthProvider } from './features/auth/AuthProvider';
import { ToastProvider } from './ui/Toast';
import { isDemo } from './demo/demo';

// The demo flat never touches the device cache, so it can't leak into a real account later.
const demoPersister = { persistClient: async () => {}, restoreClient: async () => undefined, removeClient: async () => {} };

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: isDemo() ? demoPersister : persister, maxAge: 1000 * 60 * 60 * 24, buster: 'v1' }}
      onSuccess={() => queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries())}>
      <AuthProvider>
        <ToastProvider>
          <LazyMotion features={domMax} strict>
            <App />
          </LazyMotion>
        </ToastProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
);
