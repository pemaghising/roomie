import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { F } from '@/constants/theme';
import { Art } from '@/ui/art';
import { Button, C, Screen } from '@/ui/kit';

export default function RequestSent() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const router = useRouter();
  return (
    <Screen scroll={false} footer={<Button title="Back to Pantry" onPress={() => router.back()} />}>
      <View style={styles.center}>
        <Animated.View entering={ZoomIn.duration(320)}><Art name="groceries" width={250} /></Animated.View>
        <Animated.View entering={FadeInDown.delay(140).duration(280)} style={styles.copy}>
          <Text style={styles.title}>Request Sent!</Text>
          <Text style={styles.body}>{name || 'It'} has been added to the Chores pool. A roommate will pick it up soon.</Text>
          <View style={styles.pill}><Text style={styles.pillText}>Added to Shared Tasks</Text></View>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  copy: { alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  title: { fontSize: 34, color: C.text, fontFamily: F.display },
  body: { fontSize: 16, lineHeight: 24, color: C.sub, fontFamily: F.regular, textAlign: 'center' },
  pill: { backgroundColor: C.lavender, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, marginTop: 6 },
  pillText: { fontSize: 14, color: C.lavenderText, fontFamily: F.semibold },
});
