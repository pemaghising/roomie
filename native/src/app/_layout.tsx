import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Geist_300Light, Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { font } from '@/ui/tokens';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { F } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { initNotifications } from '@/lib/push';
import { queryClient } from '@/lib/query';
import { useAppState, useRealtime } from '@/lib/state';
import { Button } from '@/ui/kit';
import { OfflineBanner } from '@/ui/offline-banner';
import { ToastProvider } from '@/ui/toast';

SplashScreen.preventAutoHideAsync();

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
  switch (gate) {
    case 'signed_out': return group === 'auth' ? null : '/auth';
    case 'needs_profile': return group === 'onboarding' && page === 'profile' ? null : '/onboarding/profile';
    case 'needs_household': return group === 'onboarding' && page !== 'profile' ? null : '/onboarding/start';
    case 'ready': return group === 'auth' || (group === 'onboarding' && page !== 'invite' && page !== 'ready') ? '/' : null;
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
  const tapped = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const url = tapped?.notification.request.content.data?.url;
    if (gate === 'ready' && typeof url === 'string' && url.startsWith('/')) router.push(url as never);
  }, [tapped, gate, router]);

  const target = redirectFor(gate, segments);
  useEffect(() => { if (target) router.replace(target as never); }, [target, router]);
  useEffect(() => { if (gate !== 'loading' && !target) SplashScreen.hideAsync(); }, [gate, target]);

  if (gate === 'error') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: '#FFF' }}>
        <Text style={{ fontSize: 24, fontFamily: F.display, color: '#111827' }}>Couldn't reach Roomie.</Text>
        <Text style={{ fontSize: 15, fontFamily: F.regular, color: '#6B7280' }}>Check your connection and try again.</Text>
        <Button title="Try again" onPress={() => state.refetch()} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFF' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="add-chore" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.75, 1], sheetCornerRadius: 28 }} />
      <Stack.Screen name="edit-profile" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.8, 1], sheetCornerRadius: 28 }} />
      <Stack.Screen name="pantry-item" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.55, 0.85], sheetCornerRadius: 28 }} />
      <Stack.Screen name="add-item" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.7, 1], sheetCornerRadius: 28 }} />
      <Stack.Screen name="restock" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.75, 1], sheetCornerRadius: 28 }} />
      <Stack.Screen name="request-sent" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="kudos" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.6], sheetCornerRadius: 28 }} />
      <Stack.Screen name="why" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.7, 1], sheetCornerRadius: 28 }} />
      <Stack.Screen name="manage-chores" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.8, 1], sheetCornerRadius: 28 }} />
      <Stack.Screen name="swap" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.85, 1], sheetCornerRadius: 28 }} />
      <Stack.Screen name="household" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.9, 1], sheetCornerRadius: 28 }} />
      <Stack.Screen name="reminders" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.85, 1], sheetCornerRadius: 28 }} />
      <Stack.Screen name="invite" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.85, 1], sheetCornerRadius: 28 }} />
      <Stack.Screen name="recap" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.9], sheetCornerRadius: 28 }} />
      <Stack.Screen name="busy-days" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.85], sheetCornerRadius: 28 }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(initNotifications, []);
  // Inter and Playfair stay until the last old-kit screen is gone (Task 10).
  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, PlayfairDisplay_700Bold,
    [font.title]: require('../../assets/fonts/Fraunces72Soft-SemiBold.ttf'),
    [font.titleItalic]: require('../../assets/fonts/Fraunces72Soft-SemiBoldItalic.ttf'),
    [font.light]: Geist_300Light, [font.regular]: Geist_400Regular, [font.medium]: Geist_500Medium, [font.semibold]: Geist_600SemiBold,
  });
  if (!fontsLoaded) return null;
  return (
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
}
