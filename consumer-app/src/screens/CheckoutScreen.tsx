import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createOrder, initializePayment } from '../services/api';
import { useCart } from '../store/cart';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { PaymentProvider } from '../services/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

export default function CheckoutScreen({ navigation, route }: Props) {
  const lines = useCart((s) => Object.values(s.lines));
  const total = useCart((s) => s.totalAmount());
  const clear = useCart((s) => s.clear);
  const [address, setAddress] = useState('');
  const [provider, setProvider] = useState<PaymentProvider>('PAYSTACK');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const place = async () => {
    if (!address.trim()) {
      setError('Please enter a delivery address');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const order = await createOrder({
        restaurantId: route.params.restaurantId,
        deliveryAddress: address.trim(),
        items: lines.map((l) => ({ menuItemId: l.menuItem.id, quantity: l.quantity })),
      });
      const init = await initializePayment({
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'NGN',
        callbackUrl: 'https://example.com/payment-callback',
        provider,
        idempotencyKey: `${order.id}:${provider}`,
      });
      if (init.authorizationUrl) {
        await Linking.openURL(init.authorizationUrl);
      }
      clear();
      navigation.replace('OrderTracking', { orderId: order.id });
    } catch (err) {
      setError((err as Error).message || 'Could not place order');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      <Text style={styles.label}>Delivery address</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="123 Marina Way, Lagos"
        multiline
      />

      <Text style={styles.label}>Payment provider</Text>
      <View style={styles.providerRow}>
        {(['STRIPE', 'PAYSTACK', 'FLUTTERWAVE'] as PaymentProvider[]).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setProvider(p)}
            style={[styles.providerBtn, provider === p ? styles.providerBtnActive : null]}
          >
            <Text style={[styles.providerText, provider === p ? styles.providerTextActive : null]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        {lines.map((l) => (
          <View key={l.menuItem.id} style={styles.lineRow}>
            <Text style={styles.lineName}>
              {l.menuItem.name} × {l.quantity}
            </Text>
            <Text style={styles.linePrice}>
              ₦{(Number(l.menuItem.price) * l.quantity).toLocaleString()}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₦{total.toLocaleString()}</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity onPress={place} style={styles.placeBtn} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeText}>Place order</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  label: { color: '#475569', marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    minHeight: 60,
    textAlignVertical: 'top',
    color: '#0f172a',
  },
  summary: { marginTop: 24, padding: 12, backgroundColor: '#f1f5f9', borderRadius: 8 },
  providerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  providerBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  providerBtnActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  providerText: { color: '#334155', fontWeight: '500' },
  providerTextActive: { color: '#166534' },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  lineName: { color: '#0f172a' },
  linePrice: { color: '#475569' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: { fontWeight: '700', color: '#0f172a' },
  totalAmount: { fontWeight: '700', color: '#0f172a' },
  error: { color: '#b91c1c', marginTop: 12, textAlign: 'center' },
  placeBtn: {
    marginTop: 24,
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeText: { color: '#fff', fontWeight: '600' },
});
