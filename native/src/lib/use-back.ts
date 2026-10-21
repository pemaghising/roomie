// Closing a screen that was opened directly (a link, a notification) has nothing to go back to: go Home instead.
import { useRouter } from 'expo-router';

export function useBack() {
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace('/'));
}
