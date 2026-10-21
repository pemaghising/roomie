import { Image } from 'expo-image';
import { Check as CheckIcon, CircleHelp, Lock } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { EMOJI_BY_CHAR, EMOJI_BY_NAME } from '../emoji-assets';
import { durations, useReducedMotion } from '../motion';
import { color, font, radius } from '../tokens';
import { GradientRing, Txt } from './primitives';
import { letterTile, tagStyle, type TagKind } from './tag-style';

/** v2/Tag: 22 tall pill, 12 SemiBold. Effort, pool, pantry status and boundary kinds. */
export function Tag({ kind, label }: { kind: TagKind; label?: string }) {
  const s = tagStyle(kind);
  const Icon = s.icon === 'lock' ? Lock : s.icon === 'help' ? CircleHelp : null;
  return (
    <View style={[styles.tag, { backgroundColor: s.bg, paddingLeft: Icon ? 8 : 10, paddingRight: Icon ? 9 : 10 }]}>
      {Icon && <Icon size={11} color={s.fg} strokeWidth={2.25} />}
      <Txt v="Tag" c={s.fg}>{label ?? s.label}</Txt>
    </View>
  );
}

/** Resolves a stored emoji character or icon-library name to the bundled Fluent 3D image. */
export function emojiAsset(value?: string | null): number | null {
  if (!value) return null;
  return EMOJI_BY_NAME[value] ?? EMOJI_BY_NAME[EMOJI_BY_CHAR[value] ?? ''] ?? null;
}

/** 3D emoji, or a Fraunces letter tile when nothing in the library matches. */
export function Emoji({ value, name, size = 26 }: { value?: string | null; name?: string; size?: number }) {
  const src = emojiAsset(value);
  if (src) return <Image source={src} style={{ width: size, height: size }} contentFit="contain" accessibilityIgnoresInvertColors />;
  if (value && !name && [...value].length <= 2) return <Text style={{ fontSize: size * 0.85, lineHeight: size }}>{value}</Text>;
  const t = letterTile(name ?? value ?? '');
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: font.title, fontSize: size * 0.62, color: t.fg }}>{t.letter}</Text>
    </View>
  );
}

/** v2/Emoji badge: rounded-square tile (44 at radius 13, scaled for other sizes) holding a 3D emoji. Never a circle. */
export const badgeRadius = (size: number) => Math.round(size * 0.3);
export function EmojiBadge({ value, name, size = 44, tint }: { value?: string | null; name?: string; size?: number; tint?: string }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: badgeRadius(size) }, tint ? { backgroundColor: tint } : null]}>
      <Emoji value={value} name={name} size={Math.round(size * 0.6)} />
    </View>
  );
}

/** v2/Check: 28 circle. Todo is the lilac→peach ring (Home) or a plain ring (Chores, sheets); done is solid violet and pops in. */
export function Check({ done, size = 28, plain = false }: { done: boolean; size?: number; plain?: boolean }) {
  const reduced = useReducedMotion();
  if (!done) return plain ? <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color.bg.surface, borderWidth: 1.75, borderColor: '#8C86C0' }} /> : <GradientRing size={size} />;
  return (
    <Animated.View entering={reduced ? undefined : FadeIn.duration(durations.fade)}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color.action.primary, alignItems: 'center', justifyContent: 'center' }}>
        <CheckIcon size={size * 0.57} color={color.text.onAccent} strokeWidth={2.75} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', height: 22, paddingRight: 10, borderRadius: radius.full },
  badge: { backgroundColor: 'rgba(252,251,255,0.8)', alignItems: 'center', justifyContent: 'center' },
});
