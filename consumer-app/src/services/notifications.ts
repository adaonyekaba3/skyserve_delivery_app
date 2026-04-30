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

async function fire(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {
    // Notifications may be disabled / unavailable in dev; ignore.
  }
}

export async function notifyOrderUpdate(title: string, body: string) {
  await fire(title, body);
}

export async function notifyPackageCreated() {
  await fire(
    'Your Queen delivery is dispatched',
    'Queen is preparing your package.',
  );
}

export async function notifyPackageReceived(senderName?: string | null) {
  const who = senderName?.trim() ? senderName.trim() : 'Someone';
  await fire(
    `${who} sent you a package via Queen`,
    'Tap to view delivery details and track with Queen.',
  );
}

const PACKAGE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order accepted by Queen',
  ACCEPTED: 'Queen is preparing your package',
  PREPARING: 'Queen is preparing your package',
  PICKED_UP: 'Picked up',
  IN_FLIGHT: 'Your package is in flight',
  DELIVERED: 'Your Queen delivery has arrived',
  CANCELLED: 'Delivery cancelled',
};

export async function notifyPackageStatus(status: string) {
  const title = PACKAGE_STATUS_LABELS[status] ?? `Package ${status}`;
  await fire(title, 'Open Queen to track your package.');
}

export async function notifyPaymentSuccess() {
  await fire(
    'Queen confirmed your payment',
    'Queen is preparing your package.',
  );
}

export async function notifyPaymentFailure() {
  await fire('Payment unsuccessful', 'Tap to retry your payment with Queen.');
}

export async function notifyBankTransferPending() {
  await fire(
    'Verifying your payment',
    'Queen is confirming your bank transfer. You will be notified shortly.',
  );
}

export async function notifyBankTransferApproved() {
  await fire(
    'Payment confirmed',
    'Queen is preparing your package.',
  );
}

export async function notifyBankTransferRejected(reason?: string) {
  await fire(
    'Payment not verified',
    reason?.trim()
      ? `${reason.trim()} Please retry payment with Queen.`
      : 'We could not verify your transfer. Please retry payment with Queen.',
  );
}
