import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { F } from '@/constants/theme';
import { firstWeek } from '@/lib/first-week';
import { useAppState } from '@/lib/state';
import { Art } from '@/ui/art';
import { Button, C, Screen } from '@/ui/kit';

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${value} ${label}`}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

/** The first win: setup is over, here is what Roomie made for you. */
export default function Ready() {
  const router = useRouter();
  const { data } = useAppState();
  const me = data?.profile.id;
  const w = data?.household && me ? firstWeek(data, me) : null;

  return (
    <Screen scroll={false} footer={<Button title="Let's go" onPress={() => router.replace('/')} disabled={!w} />}>
      <View style={styles.center}>
        <Animated.View entering={ZoomIn.duration(300)}><Art name="trophy" width={240} /></Animated.View>
        <Animated.View entering={FadeInDown.delay(150).duration(280)} style={{ alignItems: 'center' }}>
          <Text style={styles.title}>{'Your first week\nis ready.'}</Text>
          {!w ? <ActivityIndicator color={C.lavenderText} style={{ marginTop: 20 }} /> : (
            <>
              <Text style={styles.sub}>
                {w.planned ? 'Chores are shared out fairly by effort, and heavy ones stay off your busy days.' : 'Your plan is being made. It will show up on Home in a few minutes.'}
              </Text>
              <View style={styles.tiles}>
                <Tile value={w.chores} label={w.chores === 1 ? 'chore' : 'chores'} />
                <Tile value={w.roommates} label={w.roommates === 1 ? 'person' : 'people'} />
                {w.planned && <Tile value={w.myTurns} label="your turns" />}
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 34, lineHeight: 40, color: C.text, fontFamily: F.display, textAlign: 'center', marginTop: 8 },
  sub: { fontSize: 15, lineHeight: 22, color: C.sub, fontFamily: F.regular, textAlign: 'center', marginTop: 10, maxWidth: 300 },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 24 },
  tile: { minWidth: 92, backgroundColor: C.lavender, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center' },
  tileValue: { fontSize: 30, color: C.lavenderText, fontFamily: F.display },
  tileLabel: { fontSize: 12, color: C.lavenderText, fontFamily: F.semibold },
});
