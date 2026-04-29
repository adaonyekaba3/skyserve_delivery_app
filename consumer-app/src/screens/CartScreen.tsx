import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCart } from '../store/cart';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export default function CartScreen({ navigation, route }: Props) {
  const lines = useCart((s) => Object.values(s.lines));
  const total = useCart((s) => s.totalAmount());
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  if (!lines.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Your cart is empty.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lines}
        keyExtractor={(l) => l.menuItem.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.menuItem.name}</Text>
              <Text style={styles.price}>
                ₦{(Number(item.menuItem.price) * item.quantity).toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setQuantity(item.menuItem.id, Math.max(0, item.quantity - 1))}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qty}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity(item.menuItem.id, item.quantity + 1)}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => remove(item.menuItem.id)} style={styles.removeBtn}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Total: ₦{total.toLocaleString()}</Text>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout', { restaurantId: route.params.restaurantId })}
        >
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#64748b' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  name: { fontSize: 15, fontWeight: '500', color: '#0f172a' },
  price: { color: '#475569', marginTop: 4, fontSize: 13 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  qtyText: { fontSize: 18, color: '#0f172a' },
  qty: { width: 24, textAlign: 'center', fontWeight: '600', color: '#0f172a' },
  removeBtn: { padding: 8 },
  removeText: { color: '#b91c1c' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  total: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  checkoutBtn: {
    marginTop: 12,
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontWeight: '600' },
});
