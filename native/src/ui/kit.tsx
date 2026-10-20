import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { type ReactNode, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  type TextInputProps, View, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { F } from '@/constants/theme';

export const C = {
  text: '#111827', sub: '#6B7280', faint: '#9CA3AF', page: '#FAFAFA', field: '#F3F4F6', line: '#EEEEF0',
  // brand pastels, same values as the web app's tokens.css
  lavender: '#F3E8FF', lavenderStrong: '#D8B4FE', lavenderText: '#5C3B9B', peach: '#FFEDD5', peachText: '#9A3412',
  sky: '#DBEAFE', skyText: '#0369A1', mint: '#D1FAE5', mintText: '#065F46', butter: '#FEF3C7', butterText: '#92400E',
  pink: '#FEE2E2', pinkText: '#991B1B', coral: '#C2410C', danger: '#B91C1C',
};

/** Full-height screen with a pinned footer (buttons stay above the keyboard). */
export function Screen({ children, footer, scroll = true, bg = '#FFF' }: { children: ReactNode; footer?: ReactNode; scroll?: boolean; bg?: string }) {
  const body = <View style={s.body}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>{body}</ScrollView> : body}
        {footer && <View style={s.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const Title = ({ children, style }: { children: ReactNode; style?: object }) => <Text style={[s.title, style]}>{children}</Text>;
export const Sub = ({ children, style }: { children: ReactNode; style?: object }) => <Text style={[s.sub, style]}>{children}</Text>;

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: {
  title: string; onPress: () => void; variant?: 'primary' | 'ghost' | 'danger'; loading?: boolean; disabled?: boolean; style?: ViewStyle;
}) {
  const off = disabled || loading;
  return (
    <Pressable accessibilityRole="button" disabled={off} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [s.btn, variant !== 'primary' && s.btnGhost, off && { opacity: 0.45 }, pressed && { transform: [{ scale: 0.97 }] }, style]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#FFF' : C.text} /> : (
        <Text style={[s.btnText, variant === 'ghost' && { color: C.sub }, variant === 'danger' && { color: C.danger }]}>{title}</Text>
      )}
    </Pressable>
  );
}

/** Pull-to-refresh state that only shows for a user's pull, not for background refetches after a tick. */
export function usePull(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  return { refreshing, onRefresh: async () => { setRefreshing(true); try { await refetch(); } finally { setRefreshing(false); } } };
}

export const Field = (props: TextInputProps) => (
  <TextInput placeholderTextColor={C.faint} {...props} style={[s.field, props.style]} />
);

export const ErrorText = ({ children }: { children: ReactNode }) => (children ? <Text style={s.error} accessibilityRole="alert">{children}</Text> : null);

/** Back chevron and, during onboarding, a thin progress bar above it. */
export function StepHeader({ step, total, back = true }: { step?: number; total?: number; back?: boolean }) {
  const router = useRouter();
  return (
    <View style={{ gap: 20, marginBottom: 28 }}>
      {step != null && total != null && (
        <View style={s.track}><View style={[s.fill, { width: `${(step / total) * 100}%` }]} /></View>
      )}
      {back && router.canGoBack() ? (
        <Pressable accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8} style={({ pressed }) => [s.back, pressed && { opacity: 0.6 }]}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
      ) : <View style={{ height: 44 }} />}
    </View>
  );
}

/** Six boxes over one hidden input, so paste and one-time-code autofill work. */
export function CodeInput({ value, onChange, length = 6, keyboard = 'number-pad', autoFocus }: {
  value: string; onChange: (v: string) => void; length?: number; keyboard?: 'number-pad' | 'default'; autoFocus?: boolean;
}) {
  const ref = useRef<TextInput>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} style={s.codeRow} accessibilityLabel={`${length}-character code`}>
      {Array.from({ length }, (_, i) => (
        <View key={i} style={[s.codeBox, i === value.length && s.codeBoxOn]}>
          <Text style={s.codeChar}>{value[i] ?? ''}</Text>
        </View>
      ))}
      <TextInput ref={ref} value={value} onChangeText={(t) => onChange(t)} maxLength={length} autoFocus={autoFocus}
        keyboardType={keyboard} autoCapitalize="characters" autoCorrect={false}
        textContentType={keyboard === 'number-pad' ? 'oneTimeCode' : 'none'} autoComplete={keyboard === 'number-pad' ? 'one-time-code' : 'off'}
        style={s.hidden} caretHidden />
    </Pressable>
  );
}

const s = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8, gap: 4 },
  title: { fontSize: 34, lineHeight: 42, color: C.text, fontFamily: F.display },
  sub: { fontSize: 15, lineHeight: 22, color: C.sub, fontFamily: F.regular, marginTop: 8 },
  btn: { height: 56, borderRadius: 28, backgroundColor: C.text, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: 'transparent' },
  btnText: { color: '#FFF', fontSize: 17, fontFamily: F.semibold },
  field: { height: 56, borderRadius: 28, backgroundColor: C.field, paddingHorizontal: 22, fontSize: 16, color: C.text, fontFamily: F.regular },
  error: { color: C.danger, fontSize: 14, fontFamily: F.medium, marginTop: 10 },
  track: { height: 5, borderRadius: 3, backgroundColor: C.lavender, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: '#A78BFA' },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.field, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, lineHeight: 30, color: C.text, fontFamily: F.semibold, marginTop: -2 },
  codeRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  codeBox: { flex: 1, height: 56, borderRadius: 14, backgroundColor: C.field, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  codeBoxOn: { borderColor: '#A78BFA' },
  codeChar: { fontSize: 22, color: C.text, fontFamily: F.bold },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
