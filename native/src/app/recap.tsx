import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { F } from '@/constants/theme';
import { usePlus } from '@/lib/entitlement';
import { memberWeek, weekRecap, type DayState } from '@/lib/recap';
import { useMe } from '@/lib/state';
import { Avatar } from '@/ui/avatar';
import { Button, C, Screen, Sub, Title } from '@/ui/kit';

const DOT: Record<DayState, object> = {
  kept: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  missed: { backgroundColor: 'transparent', borderColor: '#7C3AED' },
  open: { backgroundColor: '#DDD6FE', borderColor: '#DDD6FE' },
  none: { backgroundColor: '#F3F4F6', borderColor: '#F3F4F6' },
  future: { backgroundColor: '#F3F4F6', borderColor: '#F3F4F6' },
};

export default function Recap() {
  const router = useRouter();
  const plus = usePlus();
  const { state } = useMe();
  const r = weekRecap(state);
  const week = memberWeek(state);
  const card = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const share = async () => {
    if (busy || !card.current) return;
    setBusy(true);
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share our week' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>Our week</Title>
      <Sub>Share how the house is doing.</Sub>
      <View ref={card} collapsable={false} style={styles.card}>
        <Text style={styles.brand}>ROOMIE · THIS WEEK</Text>
        <Text style={styles.big}>{r.done}</Text>
        <Text style={styles.bigLabel}>chore{r.done === 1 ? '' : 's'} done together</Text>
        <View style={styles.pills}>
          <View style={styles.pill}><Text style={styles.pillNum}>{r.pct}%</Text><Text style={styles.pillLabel}>of the week</Text></View>
          <View style={styles.pill}><Text style={styles.pillNum}>{r.streak}</Text><Text style={styles.pillLabel}>day streak</Text></View>
        </View>
        <View style={styles.people}>
          {r.byMember.map((m) => (
            <View key={m.user_id} style={styles.person}>
              <Avatar name={m.name} color={m.color} size={34} />
              <Text style={styles.personName} numberOfLines={1}>{m.name.split(' ')[0]}</Text>
              <Text style={styles.personDone}>{m.done}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ marginTop: 16 }}><Button title="Share recap" loading={busy} onPress={share} /></View>

      <Text style={styles.sectionTitle}>Last 7 days</Text>
      {plus ? (
        <View style={{ gap: 12 }}>
          {week.map((m) => (
            <View key={m.user_id} style={styles.weekRow} accessible accessibilityLabel={`${m.name}: kept ${m.kept} of the last 7 days`}>
              <Text style={styles.weekName} numberOfLines={1}>{m.name.split(' ')[0]}</Text>
              <View style={styles.dots}>
                {m.days.map((d, i) => <View key={m.dates[i]} style={[styles.dot, DOT[d]]} />)}
              </View>
              <Text style={styles.weekKept}>{m.kept}/7</Text>
            </View>
          ))}
          <Text style={styles.legend}>Filled = kept the day · hollow = something left · faint = no chores</Text>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => router.push('/paywall')} style={styles.locked}>
          <Ionicons name="lock-closed-outline" size={18} color={C.lavenderText} />
          <Text style={styles.lockedText}>See everyone's last 7 days with Roomie Plus</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 20, backgroundColor: '#4C1D95', borderRadius: 32, padding: 28, alignItems: 'center', gap: 6 },
  brand: { fontSize: 12, letterSpacing: 1.6, color: '#DDD6FE', fontFamily: F.bold },
  big: { fontSize: 88, lineHeight: 96, color: '#FFF', fontFamily: F.display },
  bigLabel: { fontSize: 17, color: '#EDE9FE', fontFamily: F.medium },
  pills: { flexDirection: 'row', gap: 12, marginTop: 14 },
  pill: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  pillNum: { fontSize: 24, color: '#FFF', fontFamily: F.bold },
  pillLabel: { fontSize: 12, color: '#DDD6FE', fontFamily: F.regular },
  people: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 20 },
  person: { alignItems: 'center', gap: 4, width: 64 },
  personName: { fontSize: 12, color: '#EDE9FE', fontFamily: F.medium },
  personDone: { fontSize: 18, color: '#FFF', fontFamily: F.bold },
  sectionTitle: { fontSize: 20, color: C.text, fontFamily: F.display, marginTop: 28, marginBottom: 12 },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weekName: { width: 64, fontSize: 14, color: C.text, fontFamily: F.medium },
  dots: { flex: 1, flexDirection: 'row', gap: 8 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  weekKept: { width: 32, textAlign: 'right', fontSize: 13, color: C.sub, fontFamily: F.medium },
  legend: { fontSize: 12, color: C.sub, fontFamily: F.regular },
  locked: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 18, backgroundColor: C.lavender },
  lockedText: { flex: 1, fontSize: 14, color: C.lavenderText, fontFamily: F.bold },
});
