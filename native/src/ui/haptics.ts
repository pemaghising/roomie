// One place for haptic meaning, so the same moment always feels the same.
import * as Haptics from 'expo-haptics';

export const haptic = {
  /** A single task checked off. */
  complete: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  /** The whole day done, or a streak milestone. */
  allDone: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  /** Segmented controls, day pickers, tabs. */
  select: () => Haptics.selectionAsync(),
  /** Destructive confirmation (leave home, delete). */
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
