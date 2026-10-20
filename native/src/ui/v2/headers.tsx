import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { color, font, layout } from '../tokens';
import { IconButton } from './buttons';
import { gradients, Tap, Txt } from './primitives';

/** Section title ("Your tasks today") with an optional link on the right ("Why these?", "See all"). */
export function SectionHeader({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return (
    <View style={styles.section}>
      <Txt v="Heading/Section" accessibilityRole="header" style={{ flexShrink: 1 }}>{title}</Txt>
      {link && <Tap onPress={onLink} accessibilityRole="link" hitSlop={10}><Txt v="Body/Label" c={color.text.link}>{link}</Txt></Tap>}
    </View>
  );
}

/**
 * Screen heading. Onboarding titles are Fraunces 28; page titles 34. `accent` is the one italic word
 * on a line of its own ("Make your place feel like / home.").
 */
export function Heading({ title, accent, sub, size = 'onboarding' }: { title: string; accent?: string; sub?: string; size?: 'onboarding' | 'page' }) {
  return (
    <View style={{ gap: 10 }}>
      <Txt v={size === 'page' ? 'Title/Page' : 'Title/Onboarding'} accessibilityRole="header">
        {title}{accent ? '\n' : ''}{accent ? <Text style={{ fontFamily: font.titleItalic }}>{accent}</Text> : null}
      </Txt>
      {sub && <Txt v="Body/Default" c={color.text.secondary}>{sub}</Txt>}
    </View>
  );
}

/** v2/Avatar: photo or initial inside the violet → orchid → peach ring, with an optional sun badge. */
export function Avatar({ name, uri, tint = '#F3F0FF', size = 52, sun }: { name: string; uri?: string | null; tint?: string; size?: number; sun?: boolean }) {
  const ring = Math.max(2, size * 0.048);
  return (
    <View style={{ width: size, height: size }} accessibilityLabel={name}>
      <LinearGradient colors={gradients.add} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, padding: ring }}>
        <View style={[styles.avatarInner, { borderRadius: size / 2, backgroundColor: tint }]}>
          {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            : <Text style={{ fontFamily: font.title, fontSize: size * 0.42, color: color.text.numeral }}>{name.trim().charAt(0).toUpperCase() || '?'}</Text>}
        </View>
      </LinearGradient>
      {sun && (
        <View style={[styles.sun, { width: size * 0.46, height: size * 0.46, borderRadius: size * 0.23, right: -size * 0.06, bottom: -size * 0.06 }]}>
          <Image source={require('../../../assets/emoji/sun.png')} style={{ width: size * 0.34, height: size * 0.34 }} />
        </View>
      )}
    </View>
  );
}

/** v2/Greeting header: avatar, date, "Morning, Ramesh", bell. */
export function GreetingHeader({ name, uri, dateLabel, hello, onBell, unread, onAvatar }: {
  name: string; uri?: string | null; dateLabel: string; hello: string; onBell?: () => void; unread?: boolean; onAvatar?: () => void;
}) {
  return (
    <View style={styles.greeting}>
      <Tap onPress={onAvatar} disabled={!onAvatar} accessibilityLabel="Your profile"><Avatar name={name} uri={uri} sun /></Tap>
      <View style={{ flex: 1, gap: 1 }}>
        <Txt v="Meta" c={color.text.secondary}>{dateLabel}</Txt>
        <Txt v="Title/Greeting" numberOfLines={1}>{`${hello}, ${name}`}</Txt>
      </View>
      <IconButton icon={Bell} onPress={onBell} label={unread ? 'Activity, new updates' : 'Activity'} dot={unread} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: layout.headerToItems },
  avatarInner: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  sun: { position: 'absolute', backgroundColor: color.bg.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B2470', shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
