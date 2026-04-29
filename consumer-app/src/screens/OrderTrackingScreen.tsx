import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import { getMe, getOrder, getRestaurant } from '../services/api';
import type { Order, OrderStatus, Restaurant } from '../services/types';
import StatusTimeline from '../components/StatusTimeline';
import DroneCanvas from '../components/DroneCanvas';
import { useOrders } from '../store/orders';
import { useOrderUpdates, useDroneTelemetry } from '../hooks/useOrderUpdates';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderTracking'>;
const MAP_PROVIDER = process.env.EXPO_PUBLIC_MAP_PROVIDER ?? 'google';
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN ?? '';

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

  useEffect(() => {
    let active = true;
    if (!isSignedIn) return undefined;
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
    useCallback((payload) => {
      const lat = payload.currentLatitude ? Number(payload.currentLatitude) : null;
      const lon = payload.currentLongitude ? Number(payload.currentLongitude) : null;
      if (lat !== null && lon !== null) {
        setDrone({ latitude: lat, longitude: lon });
      }
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Order not found'}</Text>
      </View>
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Order #{order.id.slice(0, 8)}</Text>
        <Text style={styles.subtitle}>{restaurant?.name}</Text>
        <Text style={styles.address}>{order.deliveryAddress}</Text>
      </View>

      {MAP_PROVIDER === 'none' || !origin || !destination ? (
        <DroneCanvas
          origin={origin}
          destination={destination}
          drone={drone}
          status={order.status as OrderStatus}
        />
      ) : (
        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
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
            <Polyline coordinates={[origin, destination]} strokeWidth={3} strokeColor="#0ea5e9" />
          </MapView>
        </View>
      )}

      <Text style={styles.section}>Status</Text>
      <StatusTimeline status={order.status as OrderStatus} />

      <TouchableOpacity onPress={openExternalMap} style={styles.btn}>
        <Text style={styles.btnText}>
          Open in {MAP_PROVIDER === 'mapbox' ? 'Mapbox' : 'Google Maps'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Restaurants')} style={styles.btn}>
        <Text style={styles.btnText}>Back to restaurants</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#475569', marginTop: 4 },
  address: { fontSize: 13, color: '#64748b', marginTop: 4 },
  section: {
    fontSize: 14,
    color: '#475569',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: -8,
    fontWeight: '600',
  },
  mapWrap: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  map: { width: '100%', height: 220 },
  btn: {
    margin: 16,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#0f172a' },
  error: { color: '#b91c1c' },
});
