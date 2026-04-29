import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import { getRestaurants } from '../services/api';
import type { Restaurant } from '../services/types';
import RestaurantCard from '../components/RestaurantCard';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Restaurants'>;

export default function RestaurantsScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [items, setItems] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getRestaurants();
      setItems(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Restaurants</Text>
        <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
          <Text style={styles.headerLink}>My orders</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item.id })}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No restaurants yet. Run the backend seed script.</Text>
        }
      />
      <TouchableOpacity onPress={() => signOut()} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  headerLink: { fontSize: 14, color: '#0f172a' },
  error: { color: '#b91c1c', textAlign: 'center', marginTop: 12 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
  signOut: { padding: 16, alignItems: 'center' },
  signOutText: { color: '#64748b' },
});
