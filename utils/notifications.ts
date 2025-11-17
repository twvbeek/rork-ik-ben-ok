import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { CheckInTime } from '@/types';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function scheduleCheckInNotifications(
  times: CheckInTime[]
): Promise<string[]> {
  if (Platform.OS === 'web') {
    console.log('Notifications not available on web');
    return [];
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const ids: string[] = [];

    for (const time of times) {
      if (!time.enabled) continue;

      const trigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: time.label || 'Tijd om in te checken',
          body: 'Laat je dierbaren weten dat het goed met je gaat vandaag ❤️',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });

      console.log(`Scheduled notification for ${time.hour}:${time.minute}:`, id);
      ids.push(id);
    }

    return ids;
  } catch (error) {
    console.error('Failed to schedule notifications:', error);
    return [];
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
