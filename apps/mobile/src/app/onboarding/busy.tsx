// 10 · Busiest days (both paths: starting a home and joining one).
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { Weekday } from '@domain/time.ts';
import { busyLabel } from '@/lib/busy';
import { updateDraft, useDraft } from '@/lib/draft';
import { color } from '@/ui/tokens';
import { Button, DayPicker, EmojiBadge, Glass, Heading, Page, Txt } from '@/ui/v2';

export default function BusyStep() {
  const router = useRouter();
  const draft = useDraft();
  const next = () => router.push('/onboarding/nudge');
  return (
    <Page back step={4} footer={
      <View style={{ gap: 18, alignItems: 'stretch' }}>
        <Button title="Continue" onPress={next} />
        <Txt v="Body/Label" c={color.text.link} style={{ textAlign: 'center' }} accessibilityRole="button" onPress={() => { updateDraft({ busyDays: [] }); next(); }}>I’ll decide later</Txt>
      </View>
    }>
      <Heading title="Your busy days" sub="We’ll keep heavy chores off these days." />
      <DayPicker value={draft.busyDays} onChange={(d) => updateDraft({ busyDays: d as Weekday[] })} />
      {draft.busyDays.length > 0 ? (
        <Animated.View key="summary" entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
          <Glass fill={0.9}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
              <EmojiBadge value="📅" tint="#F4F0FF" />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="Body/Button">{busyLabel(draft.busyDays)}</Txt>
                <Txt v="Meta" c={color.text.secondary}>Only light chores on these days</Txt>
              </View>
            </View>
          </Glass>
        </Animated.View>
      ) : (
        <View style={{ height: 62, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(122,95,214,0.35)' }} />
      )}
    </Page>
  );
}
