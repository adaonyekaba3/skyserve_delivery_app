import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getMenu, getRestaurant } from '../services/api';
import type { MenuItem, Restaurant } from '../services/types';
import { useCart } from '../store/cart';
import MenuItemRow from '../components/MenuItemRow';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'RestaurantDetail'>;

export default function RestaurantDetailScreen({ route, navigation }: Props) {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lines = useCart((s) => s.lines);
  const add = useCart((s) => s.add);
  const totalCount = useCart((s) => s.totalCount());
  const totalAmount = useCart((s) => s.totalAmount());

  useEffect(() => {
    let active = true;
    Promise.all([getRestaurant(restaurantId), getMenu(restaurantId)])
      .then(([r, m]) => {
        if (!active) return;
        setRestaurant(r);
        setMenu(m);
      })
      .catch((err) => active && setError((err as Error).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [restaurantId]);

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
        <Text style={styles.title}>{restaurant?.name}</Text>
        <Text style={styles.address}>{restaurant?.address}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={menu}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <MenuItemRow
            menuItem={item}
            inCart={lines[item.id]?.quantity ?? 0}
            onAdd={() => add(item)}
          />
        )}
      />
      {totalCount > 0 ? (
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate('Cart', { restaurantId })}
        >
          <Text style={styles.cartText}>
            View cart ({totalCount}) · ₦{totalAmount.toLocaleString()}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  address: { color: '#64748b', marginTop: 4 },
  error: { color: '#b91c1c', padding: 16 },
  cartBtn: {
    margin: 16,
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cartText: { color: '#fff', fontWeight: '600' },
});
