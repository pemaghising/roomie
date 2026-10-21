import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, elevation, radius } from './tokens';
import { Txt } from './v2';

/** A slim banner while the device has no connection. `isConnected === false` only, so an unknown state never shows it. */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  useEffect(() => NetInfo.addEventListener((s) => setOffline(s.isConnected === false || s.isInternetReachable === false)), []);
  if (!offline) return null;
  return (
    <Animated.View entering={FadeInUp.duration(200)} exiting={FadeOutUp.duration(160)} pointerEvents="none" accessibilityRole="alert"
      style={[styles.bar, { top: insets.top + 6 }]}>
      <WifiOff size={16} color={color.text.onAccent} strokeWidth={2} />
      <Txt v="Meta/Medium" c={color.text.onAccent} style={{ flex: 1 }}>You’re offline. Changes sync when you’re back.</Txt>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 24, right: 24, zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: color.text.primary, borderRadius: radius.full,
    paddingHorizontal: 16, paddingVertical: 10, ...elevation.sheet },
});
