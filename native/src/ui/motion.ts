// Reanimated side of the motion system. Values come from motion-config.ts.
import { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { enterConfig, motion } from './motion-config';

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

export { useReducedMotion };
