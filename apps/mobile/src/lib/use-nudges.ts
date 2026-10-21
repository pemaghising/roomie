// Schedules today's reminders on the phone (local notifications, so they work in Expo Go) whenever the plan changes.
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { addDays, weekdayOf } from '@domain/time.ts';
import { planNudges, sevenPm, type NudgeStyle } from './nudges';
import { getQuiet, isQuiet } from './quiet-hours';
import { myTasksOn } from './selectors';
import type { AppState } from './types';

const PREFIX = 'roomie-nudge-';

export function useNudges(s: AppState | undefined) {
  const key = s ? `${s.today}|${myTasksOn(s, s.profile.id, s.today).map((a) => a.id + a.status).join(',')}|${s.profile.nudge_style}|${JSON.stringify(s.profile.notify ?? {})}|${getQuiet().id}` : '';
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
      const prefs = { chores: true, recap: false, ...s.profile.notify };
      const quiet = getQuiet();
      const nudges = prefs.chores ? planNudges(items, (s.profile.nudge_style ?? 'motivate') as NudgeStyle, s.today, s.streak?.current ?? 0, s.household!.tz) : [];
      // the weekly recap: this coming Sunday at 7 pm
      if (prefs.recap) {
        const sunday = addDays(s.today, (7 - weekdayOf(s.today)) % 7);
        nudges.push({ id: `recap-${sunday}`, title: 'Roomie', body: 'Your week in the house is wrapped. Take a look.', at: sevenPm(sunday, s.household!.tz), url: '/recap' });
      }
      for (const n of nudges) {
        if (n.at.getTime() <= Date.now() || isQuiet(quiet, n.at.getHours())) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: PREFIX + n.id,
          content: { title: n.title, body: n.body, data: { url: n.url ?? '/' } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at },
        });
      }
    })().catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
