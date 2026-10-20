import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { nudge } from '@domain/nudge.ts';
import type { NudgeStyle } from '@domain/types.ts';
import { supabase } from './supabase';

export type PushStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

const TOKEN_KEY = 'roomie:expo-push-token';
const PRIMER_KEY = 'roomie:push-primer-seen';

/** Show reminders that arrive while the app is open, quietly. */
export function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
}

export async function pushStatus(): Promise<PushStatus> {
  if (!Device.isDevice) return 'unavailable';
  try {
    const p = await Notifications.getPermissionsAsync();
    if (p.granted) return 'granted';
    return p.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/**
 * Ask for permission, get this device's Expo token and save it as an `expo:` subscription (the server sends to those through Expo's push service).
 * Remote push needs a development build on Android (not Expo Go) and an EAS project id; without them this reports `unavailable` instead of failing.
 */
export async function registerForPush(): Promise<PushStatus> {
  if (!Device.isDevice) return 'unavailable';
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Roomie', importance: Notifications.AndroidImportance.DEFAULT });
    }
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return perm.canAskAgain ? 'undetermined' : 'denied';
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return 'unavailable';
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('save_push_subscription', { p_endpoint: `expo:${token}`, p_p256dh: 'expo', p_auth: 'expo' });
    if (error) return 'unavailable';
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable: sign-out just won't remove it */ }
    return 'granted';
  } catch {
    return 'unavailable';
  }
}

/**
 * Show the real "up for grabs" reminder (the same words the server sends) on this phone in a few seconds, as a local notification,
 * so someone can check permission and see how it looks and where tapping it goes, without waiting for a roommate to miss a chore.
 */
export async function previewPoolReminder(style: NudgeStyle): Promise<boolean> {
  try {
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'Roomie', importance: Notifications.AndroidImportance.DEFAULT });
    const { title, body } = nudge('pool', style, { chores: ['Bathroom', 'Take out trash'] });
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { url: '/chores' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
    });
    return true;
  } catch {
    return false;
  }
}

/** Stop pushes to this device (called before sign-out and account deletion). Best effort. */
export async function unregisterPush(): Promise<void> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await supabase.rpc('delete_push_subscription', { p_endpoint: `expo:${token}` });
    localStorage.removeItem(TOKEN_KEY);
  } catch { /* the server drops tokens Expo no longer recognises */ }
}

export const primerSeen = (): boolean => { try { return localStorage.getItem(PRIMER_KEY) === '1'; } catch { return true; } };
export const markPrimerSeen = () => { try { localStorage.setItem(PRIMER_KEY, '1'); } catch { /* it may show again next launch */ } };
