// Reanimated side of the motion system. Values come from motion-config.ts.
import { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import { durations, enterConfig, motion } from './motion-config';

export { durations, motion, stagger } from './motion-config';

/** The house ease: quick start, long soft landing (matches the marketing site). */
export const ease = Easing.bezier(0.2, 0.9, 0.25, 1);

/** Entering animation for item i of a list: fade + 12 px rise, staggered; a plain fade with Reduce Motion. */
export function enter(i: number, reduced: boolean) {
  const c = enterConfig(i, reduced);
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateY: c.distance }] },
      animations: {
        opacity: withDelay(c.delay, withTiming(1, { duration: c.duration, easing: ease })),
        transform: [{ translateY: withDelay(c.delay, withTiming(0, { duration: c.duration, easing: ease })) }],
      },
    };
  };
}

/** Press feedback for any tappable surface: scale to 0.97 on a firm spring (none with Reduce Motion). */
export function usePress() {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return {
    style,
    onPressIn: () => { if (!reduced) scale.value = withSpring(motion.press.scale, motion.press.spring); },
    onPressOut: () => { scale.value = withSpring(1, motion.press.spring); },
  };
}

/** A number that counts from its last value to the new one (ease-out, `durations.countUp`); jumps with Reduce Motion. */
export function useCountUp(value: number) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduced || from.current === value) { from.current = value; setShown(value); return; }
    const start = from.current;
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, (Date.now() - t0) / durations.countUp);
      setShown(Math.round(start + (value - start) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);
  return shown;
}

export { useReducedMotion };
