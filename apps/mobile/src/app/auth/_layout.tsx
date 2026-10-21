import { Stack } from 'expo-router';
import { color } from '@/ui/tokens';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg.canvas }, animation: 'ios_from_right', animationDuration: 260, gestureEnabled: true }} />;
}
