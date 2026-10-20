import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { F } from '@/constants/theme';
import { avatarUrl } from '@/lib/avatar';

/** A person's photo, or their coloured initial when they have none (or it fails to load). */
export function Avatar({ name, color, path, size = 44, ring }: { name: string; color: string; path?: string | null; size?: number; ring?: boolean }) {
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, ring && styles.ring]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{(name[0] ?? '?').toUpperCase()}</Text>
      {path ? <Image source={{ uri: avatarUrl(path) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} accessibilityLabel={`${name}'s photo`} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ring: { borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  initial: { color: '#111827', fontFamily: F.display },
});
