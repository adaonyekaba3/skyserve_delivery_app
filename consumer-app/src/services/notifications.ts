import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function bootstrapNotifications() {
  const perms = await Notifications.getPermissionsAsync();
  if (!perms.granted) {
    await Notifications.requestPermissionsAsync();
  }
}

export async function notifyOrderUpdate(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
