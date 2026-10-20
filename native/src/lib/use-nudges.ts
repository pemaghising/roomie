// Schedules today's reminders on the phone (local notifications, so they work in Expo Go) whenever the plan changes.
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { planNudges, type NudgeStyle } from './nudges';
import { myTasksOn } from './selectors';
import type { AppState } from './types';

const PREFIX = 'roomie-nudge-';

export function useNudges(s: AppState | undefined) {
  const key = s ? `${s.today}|${myTasksOn(s, s.profile.id, s.today).map((a) => a.id + a.status).join(',')}|${s.profile.nudge_style}` : '';
  useEffect(() => {
    if (!s?.household || Platform.OS === 'web') return;
    let live = true;
    (async () => {
      const perm = await Notifications.getPermissionsAsync();
      if (!perm.granted || !live) return; // the reminders primer asks first; never prompt from here
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(scheduled.filter((n) => n.identifier.startsWith(PREFIX)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
      const names = new Map(s.chores.map((c) => [c.id, c.name]));
      const items = myTasksOn(s, s.profile.id, s.today).map((a) => ({ id: a.id, name: names.get(a.chore_id) ?? 'A chore', status: a.status }));
      const nudges = planNudges(items, (s.profile.nudge_style ?? 'motivate') as NudgeStyle, s.today, s.streak?.current ?? 0, s.household!.tz);
      for (const n of nudges) {
        if (n.at.getTime() <= Date.now()) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: PREFIX + n.id,
          content: { title: n.title, body: n.body, data: { url: '/' } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at },
        });
      }
    })().catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
