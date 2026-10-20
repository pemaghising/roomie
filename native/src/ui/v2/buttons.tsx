import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { color, elevation, radius } from '../tokens';
import { Glass, gradients, Tap, Txt } from './primitives';

/** v2/Button: 56 tall, full radius. Primary is flat roof-violet (one per screen), secondary is glass, destructive is flat red. */
export function Button({ title, onPress, kind = 'primary', icon: Icon, loading, disabled, style }: {
  title: string; onPress?: () => void; kind?: 'primary' | 'secondary' | 'destructive' | 'dark'; icon?: LucideIcon;
  loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const fill = kind === 'primary' ? color.action.primary : kind === 'destructive' ? color.action.danger : kind === 'dark' ? '#16131F' : undefined;
  const fg = kind === 'secondary' ? color.text.primary : color.text.onAccent;
  const body = (
    <View style={styles.row}>
      {loading ? <ActivityIndicator color={fg} /> : <>
        {Icon && <Icon size={20} color={fg} strokeWidth={2} />}
        <Txt v="Body/Button" c={fg}>{title}</Txt>
      </>}
    </View>
  );
  return (
    <Tap onPress={onPress} disabled={disabled || loading} accessibilityLabel={title} accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}>
      {fill ? <View style={[styles.button, { backgroundColor: fill }, kind === 'primary' && elevation.liftButton]}>{body}</View>
        : <Glass r={radius.full} fill={0.9} style={styles.buttonShell}><View style={styles.buttonInner}>{body}</View></Glass>}
    </Tap>
  );
}

/** v2/Back button: 40 glass circle with a chevron (44 pt hit area). */
export function BackButton({ onPress, label = 'Back' }: { onPress: () => void; label?: string }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={label} hitSlop={8}>
      <Glass r={20} fill={0.62} style={{ width: 40, height: 40 }}>
        <View style={styles.center40}><ChevronLeft size={20} color={color.text.primary} strokeWidth={2} /></View>
      </Glass>
    </Tap>
  );
}

/** v2/Icon button: 44 circle, surface fill, soft lilac hairline, optional unread dot. */
export function IconButton({ icon: Icon, onPress, label, dot }: { icon: LucideIcon; onPress?: () => void; label: string; dot?: boolean }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={label}>
      <View style={styles.iconButton}>
        <Icon size={20} color={color.text.primary} strokeWidth={1.75} />
        {dot && <View style={styles.dot} />}
      </View>
    </Tap>
  );
}

/** v2/Add button: 56 gradient circle (violet → orchid → peach) with a white-ish plus. */
export function AddButton({ onPress, label = 'Add' }: { onPress: () => void; label?: string }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={label} feel="select">
      <LinearGradient colors={gradients.add} start={{ x: 0.15, y: 0.1 }} end={{ x: 0.9, y: 0.95 }} style={[styles.add, elevation.liftButton]}>
        <Plus size={24} color={color.text.onAccent} strokeWidth={2.25} />
      </LinearGradient>
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  button: { height: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  buttonShell: { height: 56 },
  buttonInner: { height: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  center40: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.bg.surface, borderWidth: 1, borderColor: '#ECE8F6', alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 10, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: color.action.primary, borderWidth: 2, borderColor: '#F4F4F6' },
  add: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(252,251,255,0.6)' },
});
