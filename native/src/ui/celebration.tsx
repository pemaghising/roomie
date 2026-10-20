// Clearing the day's list: a short confetti burst and two soft taps over Home, which itself turns to "All done for today" (H6).
// Never blocks the screen; covering for a roommate gets its own toast instead.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Celebration as Kind } from '@/lib/actions';
import { Confetti } from './confetti';
import { useReducedMotion } from './motion';
import { useToast } from './toast';

export function Celebration({ info, onClose }: { info: Kind; onClose: () => void }) {
  const reduced = useReducedMotion();
  const toast = useToast();
  const kind = info?.kind;
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const onClose = () => close.current();
    if (!kind) return;
    if (kind === 'covered') { toast.show('Thanks for covering. It evens out next week.', { tick: true }); onClose(); return; }
    const a = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 160);
    const b = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
    const done = setTimeout(onClose, 2200);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(done); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
  if (kind !== 'all_done' || reduced) return null;
  return <View style={StyleSheet.absoluteFill} pointerEvents="none"><Confetti count={46} /></View>;
}
