import { Tabs } from 'expo-router';
import { useAppState } from '@/lib/state';
import { HomeSkeleton } from '@/ui/skeleton';
import { TabBar } from '@/ui/tab-bar';

export default function TabsLayout() {
  const { data } = useAppState();
  // first load: show the shape of the home in grey instead of a blank screen
  if (!data) return <HomeSkeleton />;
  // the root gate redirects away from here until there is a household; render nothing meanwhile
  if (!data.household) return null;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: { backgroundColor: '#FAFAFA' } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="chores" />
      <Tabs.Screen name="pantry" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
