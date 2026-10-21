import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNudges } from '@/lib/use-nudges';
import { useAppState } from '@/lib/state';
import { HomeSkeleton } from '@/ui/skeleton';
import { color } from '@/ui/tokens';
import { Nav, type TabName } from '@/ui/v2';
import { ConfettiHost } from '@/ui/confetti-host';

function TabBar({ state, navigation }: { state: { index: number; routes: { name: string }[] }; navigation: { navigate: (n: string) => void } }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const name = state.routes[state.index]?.name;
  const active = (name === 'calendar' ? 'chores' : name) as TabName;
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      {/* the Figma "nav fade": content softly disappears under the nav instead of hitting a hard edge */}
      <LinearGradient colors={['rgba(248,246,252,0)', 'rgba(248,246,252,0.92)', color.bg.canvas]} locations={[0, 0.55, 1]} style={styles.fade} pointerEvents="none" />
      <Nav active={active} onTab={(t) => navigation.navigate(t)} onAdd={() => router.push('/add-menu')} />
    </View>
  );
}

export default function TabsLayout() {
  const { data } = useAppState();
  useNudges(data);
  // first load: show the shape of the home in grey instead of a blank screen
  if (!data) return <HomeSkeleton />;
  // the root gate redirects away from here until there is a household; render nothing meanwhile
  if (!data.household) return null;
  return (
    <View style={{ flex: 1 }}>
    <Tabs tabBar={(props) => <TabBar {...(props as unknown as Parameters<typeof TabBar>[0])} />} screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: { backgroundColor: color.bg.canvas } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="chores" />
      <Tabs.Screen name="pantry" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="calendar" options={{ href: null }} />
    </Tabs>
    <ConfettiHost />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 170 },
});
