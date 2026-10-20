// J2 · Scan QR: dark camera screen with a framed target and a sweeping line.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/ui/haptics';
import { normalizeCode, updateDraft } from '@/lib/draft';
import { useReducedMotion } from '@/ui/motion';
import { color, layout } from '@/ui/tokens';
import { Button, Tap, Txt } from '@/ui/v2';

const BOX = 240;

export default function Scan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [permission, ask] = useCameraPermissions();
  const done = useRef(false);
  const sweep = useSharedValue(0);
  useEffect(() => { if (!reduced) sweep.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true); }, [reduced, sweep]);
  useEffect(() => { if (permission && !permission.granted && permission.canAskAgain) ask(); }, [permission, ask]);
  const line = useAnimatedStyle(() => ({ transform: [{ translateY: (sweep.value - 0.5) * (BOX - 60) }] }));

  const onCode = ({ data }: { data: string }) => {
    if (done.current) return;
    const code = normalizeCode(data);
    if (code.length !== 6) return;
    done.current = true;
    haptic.allDone();
    updateDraft({ mode: 'join', code });
    router.replace('/onboarding/join');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      {permission?.granted && <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={onCode} />}
      <View style={styles.dim} pointerEvents="none" />
      <View style={{ paddingHorizontal: layout.margin }}>
        <Tap onPress={() => router.back()} accessibilityLabel="Back"><View style={styles.back}><ChevronLeft size={20} color={color.text.onAccent} /></View></Tap>
      </View>
      <Txt v="Title/Onboarding" c={color.text.onAccent} style={styles.title} accessibilityRole="header">Scan the home code</Txt>
      <View style={styles.frame}>
        {(['tl', 'tr', 'bl', 'br'] as const).map((k) => <View key={k} style={[styles.corner, styles[k]]} />)}
        <Animated.View style={[styles.line, line]} />
      </View>
      <Txt v="Body/Default" c="rgba(252,251,255,0.8)" style={{ textAlign: 'center', marginTop: 28 }}>
        {permission && !permission.granted ? 'Camera is off for Roomie. You can type the code instead.' : 'Psst, it’s on your roommate’s Profile.'}
      </Txt>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: layout.margin }}>
        <Button title="Type the code instead" kind="dark" onPress={() => router.replace('/onboarding/join')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#16131F' },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22,19,31,0.55)' },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(252,251,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center', marginTop: 28, marginBottom: 40 },
  frame: { width: BOX, height: BOX, alignSelf: 'center', borderRadius: 28, backgroundColor: 'rgba(252,251,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 44, height: 44, borderColor: color.bg.surface },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 28 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 28 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 28 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 28 },
  line: { width: BOX - 48, height: 2, borderRadius: 1, backgroundColor: color.accent.selectedStart },
});
