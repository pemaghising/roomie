import './styles/fonts.css'; // self-hosted fonts (see file)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { registerSW } from 'virtual:pwa-register';
import { LazyMotion, MotionConfig } from 'motion/react';
import './styles/tokens.css';
import './styles/base.css';
import './ui/ui.css';
import App from './App';
import { persister, queryClient } from './lib/queryClient';
import { AuthProvider } from './features/auth/AuthProvider';
import { ToastProvider } from './ui/Toast';
import { loadMotionFeatures } from './ui/motion';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24, buster: 'v1' }}
      onSuccess={() => queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries())}>
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <LazyMotion features={loadMotionFeatures} strict>
            <ToastProvider>
              <App />
            </ToastProvider>
          </LazyMotion>
        </MotionConfig>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
);
