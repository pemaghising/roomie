import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { F } from '@/constants/theme';
import { Art, type ArtName } from '@/ui/art';
import { Button, C, Screen } from '@/ui/kit';

const PAGES: { art: ArtName; title: string; body: string }[] = [
  { art: 'welcome', title: 'Peaceful\nco-living.', body: 'Share chores, groceries and good moments with the people you live with.' },
  { art: 'chores', title: 'Chores that\nrun themselves.', body: 'A fair weekly plan, easy swaps and gentle nudges. No more nagging.' },
  { art: 'trophy', title: 'Win the\nweek together.', body: 'Grow a streak as a house and celebrate every milestone.' },
];

export default function Welcome() {
  const router = useRouter();
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const list = useRef<FlatList>(null);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / Math.max(width, 1));
    if (next !== page) { Haptics.selectionAsync(); setPage(next); }
  };
  const last = page === PAGES.length - 1;

  return (
    <Screen scroll={false} footer={
      <Animated.View entering={FadeInDown.delay(250).duration(240)} style={{ gap: 4 }}>
        <View style={styles.dots} accessibilityRole="progressbar" accessibilityLabel={`Page ${page + 1} of ${PAGES.length}`}>
          {PAGES.map((p, i) => <View key={p.art} style={[styles.dot, i === page && styles.dotOn]} />)}
        </View>
        {last ? (
          <Button title="Create Account" onPress={() => router.push('/auth/email?mode=create')} />
        ) : (
          <Button title="Next" onPress={() => list.current?.scrollToIndex({ index: page + 1, animated: true })} />
        )}
        <Button title="Log In" variant="ghost" onPress={() => router.push('/auth/email?mode=login')} />
      </Animated.View>
    }>
      <View style={{ flex: 1 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <FlatList ref={list} data={PAGES} keyExtractor={(p) => p.art} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onEnd} getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            renderItem={({ item }) => (
              <View style={{ width, flex: 1 }}>
                <View style={styles.art}><Art name={item.art} width={Math.min(300, width)} /></View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </View>
            )} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  art: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 40, lineHeight: 48, color: C.text, fontFamily: F.display },
  body: { fontSize: 16, lineHeight: 24, color: C.sub, fontFamily: F.regular, marginTop: 8, marginBottom: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotOn: { width: 24, backgroundColor: '#7C3AED' },
});
