import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { F } from '@/constants/theme';

/**
 * Swipe a chore to the right to finish it (or to take it back if it is already done), like swipe actions in Todoist and Mail apps.
 * The row snaps shut again after the action, so its own state (ticked or not) is the single source of truth.
 */
export function SwipeTask({ done, onToggle, enabled = true, children }: { done: boolean; onToggle: () => void; enabled?: boolean; children: ReactNode }) {
  const ref = useRef<SwipeableMethods>(null);
  return (
    <ReanimatedSwipeable ref={ref} enabled={enabled} friction={1.5} leftThreshold={64} overshootLeft={false} overshootRight={false}
      renderLeftActions={() => (
        <View style={[styles.action, done ? styles.undo : styles.finish]}>
          <Ionicons name={done ? 'arrow-undo' : 'checkmark-circle'} size={24} color="#FFF" />
          <Text style={styles.label}>{done ? 'Undo' : 'Done'}</Text>
        </View>
      )}
      onSwipeableOpen={() => { onToggle(); ref.current?.close(); }}>
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: { width: 104, marginBottom: 10, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 2 },
  finish: { backgroundColor: '#22C55E' },
  undo: { backgroundColor: '#9CA3AF' },
  label: { fontSize: 13, color: '#FFF', fontFamily: F.bold },
});
