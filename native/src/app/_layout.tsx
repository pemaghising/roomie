import { useFonts } from 'expo-font';
import { Geist_300Light, Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { color, font } from '@/ui/tokens';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { initNotifications } from '@/lib/push';
import { queryClient } from '@/lib/query';
import { useAppState, useRealtime } from '@/lib/state';
import { Button, Txt } from '@/ui/v2';
import { OfflineBanner } from '@/ui/offline-banner';
import { ToastProvider } from '@/ui/toast';

SplashScreen.preventAutoHideAsync();

// v2 sheets draw their own blurred scrim and spring, so the route itself is a transparent overlay
const OVERLAY = { presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } } as const;

type Gate = 'loading' | 'error' | 'signed_out' | 'needs_profile' | 'needs_household' | 'ready';

/** Same decision as web src/lib/gate.ts gateFor(). */
function useGate(): Gate {
  const auth = useAuth();
  const state = useAppState();
  if (auth.loading) return 'loading';
  if (!auth.session) return 'signed_out';
  if (!state.data) return state.error ? 'error' : 'loading';
  if (!state.data.profile?.name) return 'needs_profile';
  if (!state.data.household) return 'needs_household';
  return 'ready';
}

/** Where a gate may be, and where to send it otherwise. Invite stays reachable right after creating a home. */
function redirectFor(gate: Gate, [group, page]: string[]): string | null {
  if (group === 'kit' && __DEV__) return null; // component kit, dev builds only
  switch (gate) {
    case 'signed_out': return group === 'auth' ? null : '/auth';
    case 'needs_profile': return group === 'onboarding' && page === 'profile' ? null : '/onboarding/profile';
    case 'needs_household': return group === 'onboarding' && page !== 'profile' ? null : '/onboarding/start';
    // right after setup: 06 welcome back, 12 invite and 13 all set stay reachable
    case 'ready': return (group === 'auth' && page !== 'welcome-back') || (group === 'onboarding' && page !== 'invite' && page !== 'ready') ? '/' : null;
    default: return null;
  }
}

function Root() {
  const gate = useGate();
  const state = useAppState();
  const segments = useSegments();
  const router = useRouter();
  useRealtime(gate === 'ready' ? state.data?.household?.id : undefined);

  // tapping a reminder opens the screen it names (the server sends paths like /chores or /plan)
  // native only: notifications don't exist on the web build used for screenshots (Platform.OS is fixed per build)
  const tapped = Platform.OS === 'web' ? null : Notifications.useLastNotificationResponse();
  useEffect(() => {
    const url = tapped?.notification.request.content.data?.url;
    if (gate === 'ready' && typeof url === 'string' && url.startsWith('/')) router.push(url as never);
  }, [tapped, gate, router]);

  const target = redirectFor(gate, segments);
  useEffect(() => { if (target) router.replace(target as never); }, [target, router]);
  useEffect(() => { if (gate !== 'loading' && !target) SplashScreen.hideAsync(); }, [gate, target]);

  if (gate === 'error') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: color.bg.canvas }}>
        <Txt v="Title/Onboarding">Couldn’t reach Roomie</Txt>
        <Txt v="Body/Default" c={color.text.secondary}>Check your connection and try again.</Txt>
        <Button title="Try again" onPress={() => state.refetch()} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg.canvas }, animation: 'ios_from_right', animationDuration: 260 }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="add-chore" options={OVERLAY} />
      <Stack.Screen name="add-item" options={OVERLAY} />
      <Stack.Screen name="restock" options={OVERLAY} />
      <Stack.Screen name="kudos" options={OVERLAY} />
      <Stack.Screen name="why" options={OVERLAY} />
      <Stack.Screen name="add-menu" options={OVERLAY} />
      <Stack.Screen name="reminders" options={OVERLAY} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(initNotifications, []);
  const [fontsLoaded] = useFonts({
    [font.title]: require('../../assets/fonts/Fraunces72Soft-SemiBold.ttf'),
    [font.titleItalic]: require('../../assets/fonts/Fraunces72Soft-SemiBoldItalic.ttf'),
    [font.light]: Geist_300Light, [font.regular]: Geist_400Regular, [font.medium]: Geist_500Medium, [font.semibold]: Geist_600SemiBold,
  });
  if (!fontsLoaded) return null;
  const app = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            <Root />
            <OfflineBanner />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
  // inside the desktop phone frame (web/desktop-frame.js) the frame draws the status bar and home indicator
  return IN_FRAME ? <SafeAreaInsetsContext.Provider value={FRAME_INSETS}>{app}</SafeAreaInsetsContext.Provider> : app;
}

const IN_FRAME = Platform.OS === 'web' && typeof window !== 'undefined' && window.self !== window.top;
const FRAME_INSETS = { top: 54, bottom: 34, left: 0, right: 0 };
