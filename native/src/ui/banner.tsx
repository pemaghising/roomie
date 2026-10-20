import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { F } from '@/constants/theme';

/** A tappable notice that leads somewhere: "next week's plan is ready", "a roommate wants to swap". */
export function Banner({ icon, text, onPress }: { icon: keyof typeof Ionicons.glyphMap; text: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={text} onPress={onPress} style={({ pressed }) => [styles.banner, pressed && { opacity: 0.75 }]}>
      <Ionicons name={icon} size={20} color="#5B21B6" />
      <Text style={styles.text}>{text}</Text>
      <Ionicons name="chevron-forward" size={18} color="#5B21B6" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EDE9FE', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  text: { flex: 1, fontSize: 14, lineHeight: 19, color: '#4C1D95', fontFamily: F.semibold },
});
