// 06 · Welcome back: after logging in to an account that already has a home.
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { updateDraft } from '@/lib/draft';
import { useAppState } from '@/lib/state';
import { color } from '@/ui/tokens';
import { Glass, Page, Tap, Txt } from '@/ui/v2';

export default function WelcomeBack() {
  const router = useRouter();
  const { data } = useAppState();
  const name = data?.profile?.name ?? '';
  const home = data?.household;
  const roommates = data?.members?.length ?? 0;
  const goHome = () => { updateDraft({ welcomeBack: false }); router.replace('/'); };
  return (
    <Page scroll={false} gap={20}>
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <Image source={require('../../../assets/art/welcome-back.png')} style={{ width: 132, height: 154 }} contentFit="contain" />
      </View>
      <View style={{ gap: 10, alignItems: 'center' }}>
        <Txt v="Title/Onboarding" style={{ textAlign: 'center' }} accessibilityRole="header">{`Welcome back,\n${name}.`}</Txt>
        <Txt v="Body/Default" c={color.text.secondary} style={{ textAlign: 'center' }}>Your home missed you. Everything’s right where you left it.</Txt>
      </View>
      {home ? (
        <Tap onPress={goHome} accessibilityLabel={`Open ${home.name}`}>
          <Glass fill={0.9}>
            <View style={styles.card}>
              <View style={styles.tile}><Image source={require('../../../assets/art/start-home.png')} style={{ width: 44, height: 44 }} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="Body/Row" numberOfLines={1}>{home.name}</Txt>
                <Txt v="Meta" c={color.text.secondary}>{roommates === 1 ? 'Just you' : `${roommates} roommates`}</Txt>
              </View>
              <ArrowRight size={20} color={color.text.primary} strokeWidth={1.75} />
            </View>
          </Glass>
        </Tap>
      ) : <ActivityIndicator color={color.action.primary} />}
    </Page>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  tile: { width: 52, height: 52, borderRadius: 14, backgroundColor: color.bg.tint, alignItems: 'center', justifyContent: 'center' },
});
