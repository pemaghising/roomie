// 01 · Welcome, with 03 · Log in as a sheet over it.
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/ui/motion';
import { color, layout } from '@/ui/tokens';
import { AppleMark, Button, GoogleMark, MeshBackground, Sheet, Stagger, Tap, Txt } from '@/ui/v2';
import { useToast } from '@/ui/toast';

const SITE = 'https://roomie-site-sigma.vercel.app/';

export function Legal() {
  return (
    <Txt v="Meta" c={color.text.secondary} style={{ textAlign: 'center' }}>
      {'By continuing, you agree to our\n'}
      <Txt v="Meta/Medium" c={color.text.link} onPress={() => WebBrowser.openBrowserAsync(SITE)}>Terms</Txt>
      {' and '}
      <Txt v="Meta/Medium" c={color.text.link} onPress={() => WebBrowser.openBrowserAsync(SITE)}>Privacy Policy</Txt>.
    </Txt>
  );
}

/** A chip from frame 01 that drifts a few points, each on its own phase (none with Reduce Motion). */
function Chip({ src, x, y, w, phase }: { src: number; x: number; y: number; w: number; phase: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.value = withDelay(phase, withRepeat(withSequence(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })), -1));
  }, [reduced, t, phase]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -5 * t.value }] }));
  return (
    <Animated.View entering={reduced ? undefined : FadeIn.delay(280 + phase / 4).duration(260)} style={[{ position: 'absolute', left: x, top: y }, style]}>
      <Image source={src} style={{ width: w, height: 90 }} contentFit="contain" />
    </Animated.View>
  );
}

const CHIPS = [
  { src: require('../../../assets/art/chip-dishes.png'), x: 24 - 24, y: 134 - 24, w: 542 / 3, phase: 0 },
  { src: require('../../../assets/art/chip-turn.png'), x: 255 - 24, y: 124 - 24, w: 485 / 3, phase: 700 },
  { src: require('../../../assets/art/chip-milk.png'), x: 180 - 24, y: 354 - 24, w: 499 / 3, phase: 1300 },
];

export default function Welcome() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [login, setLogin] = useState(false);
  const soon = () => toast.show('Coming soon. Use your email for now.');

  return (
    <View style={styles.root}>
      <MeshBackground />
      <View style={[styles.art, { top: 0 }]} accessible={false}>
        <Animated.View entering={FadeIn.duration(320)} style={styles.mascot}>
          <Image source={require('../../../assets/art/welcome-mascot.png')} style={{ width: 260, height: 260 }} contentFit="contain" />
        </Animated.View>
        {CHIPS.map((c) => (
          <Chip key={c.phase} {...c} />
        ))}
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 18 }]}>
        <Stagger gap={0} from={2}>
          <View style={{ gap: 10, alignItems: 'center', marginBottom: 34 }}>
            <Txt v="Title/Onboarding" style={{ textAlign: 'center' }} accessibilityRole="header">
              {'Make your place\nfeel like '}<Txt v="Title/Accent">home.</Txt>
            </Txt>
            <Txt v="Body/Default" c={color.text.secondary} style={{ textAlign: 'center' }}>{'Share the chores, share the snacks,\nkeep the peace.'}</Txt>
          </View>
          <View style={{ gap: 12 }}>
            <Button title="Create my account" onPress={() => router.push('/auth/email?mode=create')} />
            <Button title="I already have one" kind="secondary" onPress={() => setLogin(true)} />
          </View>
          <View style={{ marginTop: 18 }}><Legal /></View>
        </Stagger>
      </View>

      {login && (
        <Sheet onClose={() => setLogin(false)} title="Good to see you again" sub="Pick the way you signed up last time.">
          <View style={{ gap: 12 }}>
            <Tap onPress={soon} accessibilityLabel="Continue with Apple">
              <View style={[styles.provider, { backgroundColor: '#16131F' }]}><AppleMark /><Txt v="Body/Button" c={color.text.onAccent}>Continue with Apple</Txt></View>
            </Tap>
            <Tap onPress={soon} accessibilityLabel="Continue with Google">
              <View style={[styles.provider, styles.providerLight]}><GoogleMark /><Txt v="Body/Button">Continue with Google</Txt></View>
            </Tap>
            <Tap onPress={() => { setLogin(false); router.push('/auth/email?mode=login'); }} accessibilityLabel="Continue with email">
              <View style={[styles.provider, styles.providerLight]}><Mail size={18} color={color.text.primary} strokeWidth={1.75} /><Txt v="Body/Button">Continue with email</Txt></View>
            </Tap>
          </View>
          <Txt v="Body/Default" c={color.text.secondary} style={{ textAlign: 'center' }}>
            {'First time here? '}
            <Txt v="Body/Label" c={color.text.link} onPress={() => { setLogin(false); router.push('/auth/email?mode=create'); }}>Create an account</Txt>
          </Txt>
        </Sheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  art: { position: 'absolute', width: 393, alignSelf: 'center', height: 470 },
  mascot: { position: 'absolute', left: 66, top: 152 },
  bottom: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: layout.margin },
  provider: { height: 56, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  providerLight: { backgroundColor: color.bg.surface, borderWidth: 1, borderColor: '#ECEAF3' },
});
