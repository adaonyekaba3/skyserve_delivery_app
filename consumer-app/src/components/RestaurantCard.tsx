import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Restaurant } from '../services/types';

interface Props {
  restaurant: Restaurant;
  onPress: () => void;
}

export default function RestaurantCard({ restaurant, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Text style={styles.name}>{restaurant.name}</Text>
      <Text style={styles.meta}>{restaurant.address}</Text>
      <View style={styles.row}>
        <Text style={styles.eta}>~25 min</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.cuisine}>Drone delivery</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  name: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  eta: { fontSize: 13, color: '#0f172a', fontWeight: '500' },
  dot: { marginHorizontal: 6, color: '#94a3b8' },
  cuisine: { fontSize: 13, color: '#64748b' },
});
