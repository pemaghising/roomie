import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 2 } } });

// Refetch when the app returns to the foreground, like a browser tab regaining focus.
AppState.addEventListener('change', (s) => focusManager.setFocused(s === 'active'));
