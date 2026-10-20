import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { F } from '@/constants/theme';
import { updateDraft, useDraft } from '@/lib/draft';
import { Art } from '@/ui/art';
import { Button, C, ErrorText, Field, Screen, StepHeader, Sub, Title } from '@/ui/kit';

export default function ChoresStep() {
  const router = useRouter();
  const { chores } = useDraft();
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: string) => {
    Haptics.selectionAsync();
    updateDraft({ chores: chores.map((c) => (c.key === key ? { ...c, selected: !c.selected } : c)) });
    setError(null);
  };
  const add = () => {
    const name = custom.trim();
    if (!name) return setAdding(false);
    updateDraft({ chores: [...chores, { key: `custom-${Date.now()}`, name, icon: '✨', effort: 2, cadence: 'weekly', selected: true }] });
    setCustom('');
    setAdding(false);
  };
  const next = () => {
    if (!chores.some((c) => c.selected)) return setError('Keep at least one chore — you can add more later.');
    router.push('/onboarding/busy');
  };

  return (
    <Screen footer={<Button title="Continue" onPress={next} />}>
      <StepHeader step={4} total={6} />
      <View style={{ marginBottom: 12 }}><Art name="chores" width={150} /></View>
      <Title>{"Let's set up your\nchores."}</Title>
      <Sub>We've suggested a few basics. Tap to keep or remove them.</Sub>
      <View style={{ gap: 10, marginTop: 24 }}>
        {chores.map((c) => (
          <Animated.View key={c.key} layout={LinearTransition.duration(240)} entering={FadeIn}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: c.selected }} onPress={() => toggle(c.key)}
              style={({ pressed }) => [styles.row, c.selected ? styles.rowOn : styles.rowOff, pressed && { transform: [{ scale: 0.98 }] }]}>
              <Text style={{ fontSize: 18 }}>{c.icon}</Text>
              <Text style={[styles.name, c.selected && { color: C.skyText, fontFamily: F.semibold }]}>{c.name}</Text>
              <View style={[styles.check, c.selected && styles.checkOn]}>{c.selected && <Text style={styles.tick}>✓</Text>}</View>
            </Pressable>
          </Animated.View>
        ))}
        {adding ? (
          <Field autoFocus placeholder="e.g. Water the plants" value={custom} onChangeText={setCustom} maxLength={40}
            returnKeyType="done" onSubmitEditing={add} onBlur={add} />
        ) : (
          <Pressable onPress={() => setAdding(true)} style={({ pressed }) => [styles.add, pressed && { transform: [{ scale: 0.98 }] }]}>
            <Text style={styles.addText}>+  Add custom chore</Text>
          </Pressable>
        )}
      </View>
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 52, borderRadius: 26, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowOn: { backgroundColor: C.sky },
  rowOff: { backgroundColor: '#FFF', borderWidth: 1, borderColor: C.line },
  name: { flex: 1, fontSize: 16, color: C.text, fontFamily: F.regular },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: C.text, borderColor: C.text },
  tick: { color: '#FFF', fontSize: 12, fontFamily: F.bold },
  add: { height: 52, borderRadius: 26, backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 15, color: C.lavenderText, fontFamily: F.semibold },
});
