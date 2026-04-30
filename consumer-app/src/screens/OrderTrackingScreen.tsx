import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View, Linking, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import { getMe, getOrder, getRestaurant } from '../services/api';
import type { OrderStatus, Restaurant } from '../services/types';
import StatusTimeline from '../components/StatusTimeline';
import DroneCanvas from '../components/DroneCanvas';
import { useOrders } from '../store/orders';
import { useOrderUpdates, useDroneTelemetry } from '../hooks/useOrderUpdates';
import {
  Screen,
  AppHeader,
  Card,
  Badge,
  statusToBadge,
  Loader,
  Button,
  EmptyState,
  Icon,
} from '../ui';
import type { OrdersStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderTracking'>;
const MAP_PROVIDER = process.env.EXPO_PUBLIC_MAP_PROVIDER ?? 'google';
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN ?? '';

const STATUS_HEADLINE: Record<OrderStatus, string> = {
  PENDING: 'We received your order',
  ACCEPTED: 'Restaurant accepted',
  PREPARING: 'Your meal is being prepared',
  PICKED_UP: 'Drone has picked it up',
  IN_FLIGHT: 'Your order is in flight',
  DELIVERED: 'Delivered. Enjoy!',
  CANCELLED: 'Order cancelled',
};

export default function OrderTrackingScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { isSignedIn } = useAuth();
  const order = useOrders((s) => s.byId[orderId]);
  const upsert = useOrders((s) => s.upsert);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [userDbId, setUserDbId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drone, setDrone] = useState<{ latitude: number; longitude: number } | null>(null);
  const [droneMeta, setDroneMeta] = useState<{ id?: string; battery?: number; status?: string }>(
    {},
  );

  useEffect(() => {
    let active = true;
    if (!isSignedIn) {
      setLoading(false);
      return undefined;
    }
    Promise.all([getOrder(orderId), getMe()])
      .then(async ([orderData, me]) => {
        if (!active) return;
        upsert(orderData);
        setUserDbId(me.dbUserId);
        const r = await getRestaurant(orderData.restaurantId);
        if (active) setRestaurant(r);
      })
      .catch((err) => active && setError((err as Error).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [isSignedIn, orderId, upsert]);

  useOrderUpdates(userDbId);
  useDroneTelemetry(
    useCallback((payload: any) => {
      const lat = payload.currentLatitude ? Number(payload.currentLatitude) : null;
      const lon = payload.currentLongitude ? Number(payload.currentLongitude) : null;
      if (lat !== null && lon !== null) {
        setDrone({ latitude: lat, longitude: lon });
      }
      setDroneMeta({
        id: payload.droneId ?? payload.id,
        battery: payload.batteryLevel ? Number(payload.batteryLevel) : undefined,
        status: payload.droneStatus ?? payload.status,
      });
    }, []),
  );

  if (loading) {
    return (
      <Screen>
        <Loader fullscreen label="Loading order..." />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <AppHeader title="Order tracking" showBack />
        <EmptyState
          icon={<Icon name="alert-triangle" size={26} color="#D97706" />}
          title="Order not found"
          description={error ?? 'We could not load this order.'}
          ctaLabel="Back"
          onCta={() => navigation.canGoBack() && navigation.goBack()}
        />
      </Screen>
    );
  }

  const origin =
    restaurant && restaurant.latitude && restaurant.longitude
      ? { latitude: Number(restaurant.latitude), longitude: Number(restaurant.longitude) }
      : null;
  const destination =
    order.deliveryLatitude && order.deliveryLongitude
      ? { latitude: Number(order.deliveryLatitude), longitude: Number(order.deliveryLongitude) }
      : origin;

  const openExternalMap = async () => {
    if (!origin || !destination) return;
    const googleUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
    const mapboxUrl = MAPBOX_TOKEN
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+1f2937(${destination.longitude},${destination.latitude})/pin-s+16a34a(${origin.longitude},${origin.latitude})/auto/600x400?access_token=${MAPBOX_TOKEN}`
      : googleUrl;
    await Linking.openURL(MAP_PROVIDER === 'mapbox' ? mapboxUrl : googleUrl);
  };

  const status = order.status as OrderStatus;
  const badge = statusToBadge(status);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Order tracking" subtitle={`#${order.id.slice(0, 8)}`} showBack />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Card padding="lg" className="mb-4 bg-primary border-primary">
          <View className="flex-row items-center justify-between">
            <Badge label={badge.label} tone="gold" />
            {status === 'IN_FLIGHT' || status === 'PICKED_UP' ? (
              <View className="flex-row items-center gap-1.5 px-2 py-1 rounded-full bg-white/10">
                <Icon
                  name="navigation"
                  size={12}
                  color="#C6A052"
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
                <Text
                  className="text-accent text-[11px]"
                  style={{ fontFamily: 'Inter_600SemiBold' }}
                >
                  Drone live
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            className="text-white text-2xl mt-3"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            {STATUS_HEADLINE[status]}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            <Icon name="clock" size={12} color="rgba(255,255,255,0.8)" />
            <Text
              className="text-white/80 text-sm"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {`ETA ${status === 'DELIVERED' ? '0' : '8\u201312'} minutes`}
            </Text>
          </View>
          {restaurant ? (
            <Text
              className="text-white/70 text-xs mt-3"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              From {restaurant.name}
            </Text>
          ) : null}
          <Text
            className="text-white/70 text-xs mt-1"
            style={{ fontFamily: 'Inter_500Medium' }}
          >
            To {order.deliveryAddress}
          </Text>
        </Card>

        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="text-text text-base"
              style={{ fontFamily: 'Inter_600SemiBold' }}
            >
              Drone telemetry
            </Text>
            <Badge
              label={droneMeta.status ?? 'IDLE'}
              tone={droneMeta.status === 'IN_FLIGHT' ? 'gold' : 'neutral'}
              size="sm"
            />
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Icon name="cpu" size={12} color="#64748B" />
                <Text
                  className="text-muted text-xs"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  Drone ID
                </Text>
              </View>
              <Text
                className="text-text text-sm mt-1"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              >
                {droneMeta.id ? droneMeta.id.slice(0, 8) : '---'}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Icon name="battery" size={12} color="#64748B" />
                <Text
                  className="text-muted text-xs"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  Battery
                </Text>
              </View>
              <Text
                className="text-text text-sm mt-1"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              >
                {droneMeta.battery !== undefined ? `${Math.round(droneMeta.battery)}%` : '--%'}
              </Text>
              <View className="mt-1.5 h-1 rounded-full bg-hairline overflow-hidden">
                <View
                  className="h-full bg-accent"
                  style={{
                    width: `${Math.max(0, Math.min(100, droneMeta.battery ?? 0))}%`,
                  }}
                />
              </View>
            </View>
          </View>
        </Card>

        <Card className="mb-4" padding="md">
          <Text
            className="text-text text-base mb-3"
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            Live location
          </Text>
          {MAP_PROVIDER === 'none' || !origin || !destination ? (
            <DroneCanvas origin={origin} destination={destination} drone={drone} status={status} />
          ) : (
            <View
              className="rounded-lg overflow-hidden border border-border"
              style={{ height: 220 }}
            >
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: origin.latitude,
                  longitude: origin.longitude,
                  latitudeDelta: 0.2,
                  longitudeDelta: 0.2,
                }}
              >
                <Marker coordinate={origin} title="Restaurant" />
                <Marker coordinate={destination} title="Delivery point" />
                {drone ? <Marker coordinate={drone} title="Drone" /> : null}
                <Polyline coordinates={[origin, destination]} strokeWidth={3} strokeColor="#C6A052" />
              </MapView>
            </View>
          )}
          <View className="flex-row gap-2 mt-3">
            <View className="flex-1">
              <Button
                label="Map"
                onPress={openExternalMap}
                variant="secondary"
                size="sm"
                icon={<Icon name="map" size={14} color="#0B1C2C" />}
                fullWidth
              />
            </View>
            <View className="flex-1">
              <Button
                label="Support"
                onPress={() =>
                  Alert.alert(
                    'Concierge support',
                    'Tap call to reach a SkyServe agent.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Call',
                        onPress: () => Linking.openURL('tel:+2348000000000'),
                      },
                    ],
                  )
                }
                variant="ghost"
                size="sm"
                icon={<Icon name="phone" size={14} color="#0B1C2C" />}
                fullWidth
              />
            </View>
          </View>
        </Card>

        <Card>
          <Text
            className="text-text text-base mb-3"
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            Status timeline
          </Text>
          <StatusTimeline status={status} />
        </Card>

        {error ? (
          <View className="bg-danger-soft rounded-md mt-4 px-3 py-2.5">
            <Text className="text-danger text-sm" style={{ fontFamily: 'Inter_500Medium' }}>
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
