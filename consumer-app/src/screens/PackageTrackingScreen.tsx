import React, { useEffect, useState } from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import {
  AppHeader,
  Badge,
  Button,
  Card,
  Icon,
  Loader,
  Screen,
  statusToBadge,
} from '../ui';
import StatusTimeline from '../components/StatusTimeline';
import { getMe, getOrder, getPackage } from '../services/api';
import type {
  Order,
  PackageRecord,
  PackageView,
} from '../services/types';
import { useOrders } from '../store/orders';
import { useOrderUpdates } from '../hooks/useOrderUpdates';
import { formatNgDisplay } from '../utils/phone';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PackageTracking'
>;

const PUBLIC_BASE =
  process.env.EXPO_PUBLIC_TRACK_BASE_URL ?? 'https://app.skyrunner.ng/track';

export default function PackageTrackingScreen({ route, navigation }: Props) {
  const { packageId, trackingToken, orderId } = route.params;
  const { isSignedIn } = useAuth();
  const order = useOrders((s) => s.byId[orderId]);
  const upsert = useOrders((s) => s.upsert);
  const [pkg, setPkg] = useState<PackageRecord | null>(null);
  const [pkgView, setPkgView] = useState<PackageView | null>(null);
  const [userDbId, setUserDbId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      isSignedIn ? getMe() : Promise.resolve(null),
      getPackage(packageId),
      orderId ? getOrder(orderId) : Promise.resolve(null),
    ])
      .then(([me, view, fetchedOrder]) => {
        if (!active) return;
        if (me) setUserDbId(me.user?.dbUserId ?? null);
        setPkg(view.package);
        setPkgView(view);
        if (fetchedOrder) upsert(fetchedOrder);
        else if (view.order) upsert(view.order as Order);
      })
      .catch((err) => {
        if (active) setError((err as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isSignedIn, packageId, orderId, upsert]);

  useOrderUpdates(userDbId);

  const onCopyLink = async () => {
    if (!trackingToken) return;
    const link = `${PUBLIC_BASE}/${trackingToken}`;
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // expo-clipboard not installed yet; fall back to Share sheet (Copy is always present).
      await Share.share({ message: link });
    }
  };

  const onShareLink = async () => {
    if (!trackingToken) return;
    const link = `${PUBLIC_BASE}/${trackingToken}`;
    try {
      await Share.share({
        message: `Track your Queen delivery: ${link}`,
      });
    } catch {
      // User dismissed share dialog.
    }
  };

  if (loading) return <Loader fullscreen label="Loading package..." />;

  if (error || !pkg) {
    return (
      <Screen scroll={false}>
        <AppHeader showBack title="Package" />
        <View className="px-5 mt-6">
          <Card padding="md">
            <Text
              className="text-danger"
              style={{ fontFamily: 'Inter_600SemiBold' }}
            >
              {error ?? 'Package not found'}
            </Text>
          </Card>
        </View>
      </Screen>
    );
  }

  const badge = order ? statusToBadge(order.status) : null;
  const isUnregistered = pkg.recipientType === 'guest';

  return (
    <Screen scroll={false}>
      <AppHeader
        showBack
        title="Your Queen delivery is arriving"
        subtitle={`Tracking ${pkg.trackingToken}`}
        right={
          <Button
            label="Share link"
            variant="ghost"
            size="sm"
            icon={<Icon name="share-2" size={16} color="#0B1C2C" />}
            onPress={onShareLink}
          />
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 14 }}
      >
        {badge ? (
          <Card padding="md" className="bg-primary">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text
                  className="text-cream/70 text-xs mb-1"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  Status
                </Text>
                <Text
                  className="text-cream"
                  style={{ fontFamily: 'Inter_700Bold', fontSize: 22 }}
                >
                  {STATUS_HEADLINES[order!.status] ?? badge.label}
                </Text>
                <Text
                  className="text-cream/70 mt-1"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  Drone courier from{' '}
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {pkg.pickupAddress}
                  </Text>
                </Text>
              </View>
              <Badge tone={badge.tone} label={badge.label} />
            </View>
          </Card>
        ) : null}

        {isUnregistered ? (
          <Card padding="md" className="bg-accent-soft border-accent">
            <View className="flex-row items-start gap-3">
              <Icon name="info" size={18} color="#0B1C2C" />
              <View className="flex-1">
                <Text
                  className="text-text"
                  style={{ fontFamily: 'Inter_600SemiBold' }}
                >
                  Recipient is new to Queen
                </Text>
                <Text
                  className="text-text/80 text-xs mt-1"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  Share this tracking link with{' '}
                  {formatNgDisplay(pkg.recipientPhone)} so they know to expect
                  the drone.
                </Text>
                <View className="flex-row gap-2 mt-3">
                  <Button
                    size="sm"
                    label={copied ? 'Copied' : 'Copy link'}
                    icon={
                      <Icon name="copy" size={14} color="#FFFFFF" />
                    }
                    onPress={onCopyLink}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    label="Share"
                    icon={
                      <Icon name="share-2" size={14} color="#0B1C2C" />
                    }
                    onPress={onShareLink}
                  />
                </View>
              </View>
            </View>
          </Card>
        ) : null}

        <Card padding="md">
          <Text
            className="text-text font-semi mb-3"
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            Delivery details
          </Text>
          <DetailRow label="Recipient" value={formatNgDisplay(pkg.recipientPhone)} />
          {pkg.recipientName ? (
            <DetailRow label="Name" value={pkg.recipientName} />
          ) : null}
          <DetailRow label="Drop-off" value={pkg.dropoffAddress} />
          <DetailRow
            label="Item"
            value={`${pkg.category.toUpperCase()} • ${pkg.weightClass}${
              pkg.isFragile ? ' • fragile' : ''
            }`}
          />
          {pkg.description ? (
            <DetailRow label="Notes" value={pkg.description} />
          ) : null}
        </Card>

        {order ? (
          <Card padding="md">
            <Text
              className="text-text font-semi mb-3"
              style={{ fontFamily: 'Inter_600SemiBold' }}
            >
              Status timeline
            </Text>
            <StatusTimeline status={order.status} />
          </Card>
        ) : null}

        <Button
          label="Done"
          variant="secondary"
          fullWidth
          onPress={() => navigation.navigate('MainTabs')}
        />
      </ScrollView>
    </Screen>
  );
}

const STATUS_HEADLINES: Record<string, string> = {
  PENDING: 'Your order has been accepted by Queen',
  ACCEPTED: 'Queen is preparing your package',
  PREPARING: 'Queen is preparing your package',
  PICKED_UP: 'Drone has picked it up',
  IN_FLIGHT: 'Your package is in flight',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row mb-2">
      <Text
        className="text-muted text-xs"
        style={{ fontFamily: 'Inter_500Medium', width: 110 }}
      >
        {label}
      </Text>
      <Text
        className="text-text text-sm flex-1"
        style={{ fontFamily: 'Inter_500Medium' }}
      >
        {value}
      </Text>
    </View>
  );
}
