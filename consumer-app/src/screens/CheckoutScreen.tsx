import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import {
  createOrder,
  getPaymentStatus,
  initializePayment,
} from '../services/api';
import { useCart } from '../store/cart';
import {
  Screen,
  AppHeader,
  Card,
  Input,
  Button,
  BottomBar,
  Icon,
  type IconName,
} from '../ui';
import {
  notifyPaymentFailure,
  notifyPaymentSuccess,
} from '../services/notifications';
import type { CartStackParamList } from '../navigation/RootNavigator';
import type { PaymentProvider } from '../services/types';

type Props = NativeStackScreenProps<CartStackParamList, 'Checkout'>;

const PROVIDERS: {
  id: PaymentProvider;
  label: string;
  sub: string;
  icon: IconName;
}[] = [
  {
    id: 'FLUTTERWAVE',
    label: 'Flutterwave POS',
    sub: 'Cards \u00B7 Bank \u00B7 USSD',
    icon: 'credit-card',
  },
  {
    id: 'BANK_TRANSFER',
    label: 'Bank transfer (Providus)',
    sub: 'Pay in your bank app, upload proof',
    icon: 'upload',
  },
];

function SectionHeader({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <View className="h-7 w-7 rounded-full bg-primary-soft items-center justify-center">
        <Icon name={icon} size={14} color="#0B1C2C" />
      </View>
      <Text
        className="text-text text-base"
        style={{ fontFamily: 'Inter_600SemiBold' }}
      >
        {label}
      </Text>
    </View>
  );
}

const formatNgn = (n: number) => `\u20A6${n.toLocaleString('en-NG')}`;

export default function CheckoutScreen({ navigation, route }: Props) {
  const flow = route.params?.flow ?? 'food';
  const passedOrderId = route.params?.orderId ?? null;
  const passedAmount = route.params?.totalAmount ?? null;
  const lines = useCart((s) => Object.values(s.lines));
  const cartTotal = useCart((s) => s.totalAmount());
  const clear = useCart((s) => s.clear);
  const [address, setAddress] = useState('');
  const [provider, setProvider] = useState<PaymentProvider>('FLUTTERWAVE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalNumeric = passedAmount
    ? Number(passedAmount)
    : cartTotal;

  const isPackage = flow === 'package';

  useEffect(() => {
    if (isPackage) {
      // Package flow: address already chosen in wizard.
      setAddress('');
    }
  }, [isPackage]);

  const place = async () => {
    if (!isPackage && !address.trim()) {
      setError('Please enter a delivery address');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let orderId = passedOrderId;
      let amount = passedAmount;

      if (!orderId) {
        const order = await createOrder({
          restaurantId: route.params!.restaurantId!,
          deliveryAddress: address.trim(),
          items: lines.map((l) => ({
            menuItemId: l.menuItem.id,
            quantity: l.quantity,
          })),
        });
        orderId = order.id;
        amount = order.totalAmount;
      }

      const init = await initializePayment({
        orderId: orderId!,
        amount: amount!,
        currency: 'NGN',
        callbackUrl:
          process.env.EXPO_PUBLIC_PAYMENT_CALLBACK_URL ??
          'https://app.skyrunner.ng/payment/callback',
        provider,
        idempotencyKey: `${orderId}:${provider}`,
      });

      if (provider === 'BANK_TRANSFER') {
        if (!init.instructions) {
          throw new Error('Bank transfer instructions unavailable');
        }
        navigation.replace('BankTransfer', {
          paymentId: init.id,
          orderId: orderId!,
          instructions: init.instructions,
          flow,
        });
        return;
      }

      if (init.authorizationUrl) {
        await WebBrowser.openBrowserAsync(init.authorizationUrl, {
          dismissButtonStyle: 'close',
        });
      }

      if (init.providerRef) {
        try {
          const status = await getPaymentStatus(init.providerRef);
          if (status.status === 'CAPTURED' || status.status === 'AUTHORIZED') {
            void notifyPaymentSuccess();
          } else if (status.status === 'FAILED') {
            void notifyPaymentFailure();
          }
        } catch {
          // Status check is best-effort; webhook will still settle the payment.
        }
      }

      if (!isPackage) clear();
      navigation.replace('OrderTracking', { orderId: orderId! });
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ?? (err as Error).message;
      setError(msg ?? 'Could not place order');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader
        title="Checkout"
        subtitle={
          isPackage
            ? 'Pay for your drone courier'
            : 'Confirm your delivery and payment'
        }
        showBack
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isPackage ? (
          <Card className="mb-4" padding="lg">
            <SectionHeader icon="navigation" label="Delivery address" />
            <Input
              value={address}
              onChangeText={setAddress}
              placeholder="123 Marina Way, Lagos"
              multiline
              style={{ minHeight: 60, textAlignVertical: 'top' }}
            />
            <View className="flex-row items-center gap-1.5 mt-2">
              <Icon name="clock" size={12} color="#64748B" />
              <Text
                className="text-subtle text-xs"
                style={{ fontFamily: 'Inter_400Regular' }}
              >
                {`Drone arrives in ~10\u201315 min after confirmation.`}
              </Text>
            </View>
          </Card>
        ) : null}

        <Card className="mb-4" padding="lg">
          <SectionHeader icon="credit-card" label="Payment method" />
          {PROVIDERS.map((p) => {
            const active = provider === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setProvider(p.id)}
                className={`flex-row items-center p-3 rounded-lg border mb-2 ${
                  active
                    ? 'border-primary bg-primary-soft'
                    : 'border-border bg-surface'
                }`}
              >
                <View className="h-9 w-9 rounded-full bg-cream items-center justify-center mr-3">
                  <Icon name={p.icon} size={16} color="#0B1C2C" />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-sm ${active ? 'text-primary' : 'text-text'}`}
                    style={{ fontFamily: 'Inter_600SemiBold' }}
                  >
                    {p.label}
                  </Text>
                  <Text
                    className="text-muted text-xs mt-0.5"
                    style={{ fontFamily: 'Inter_400Regular' }}
                  >
                    {p.sub}
                  </Text>
                </View>
                <View
                  className={`h-5 w-5 rounded-full items-center justify-center ${
                    active ? 'bg-primary' : 'border-2 border-border'
                  }`}
                >
                  {active ? (
                    <Icon name="check" size={12} color="#FFFFFF" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </Card>

        <Card padding="lg">
          <SectionHeader icon="file-text" label="Order summary" />
          {!isPackage
            ? lines.map((l) => (
                <View
                  key={l.menuItem.id}
                  className="flex-row justify-between py-1.5"
                >
                  <Text
                    className="text-text text-sm flex-1 pr-2"
                    style={{ fontFamily: 'Inter_500Medium' }}
                    numberOfLines={1}
                  >
                    {`${l.menuItem.name} \u00D7 ${l.quantity}`}
                  </Text>
                  <Text
                    className="text-muted text-sm"
                    style={{ fontFamily: 'Inter_500Medium' }}
                  >
                    {formatNgn(Number(l.menuItem.price) * l.quantity)}
                  </Text>
                </View>
              ))
            : (
              <View className="flex-row justify-between py-1.5">
                <Text
                  className="text-text text-sm flex-1"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  Drone courier service
                </Text>
                <Text
                  className="text-muted text-sm"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  {formatNgn(totalNumeric)}
                </Text>
              </View>
            )}
          <View className="border-t border-hairline mt-3 pt-3 flex-row justify-between">
            <Text
              className="text-text text-base"
              style={{ fontFamily: 'Inter_700Bold' }}
            >
              Total
            </Text>
            <Text
              className="text-text text-base"
              style={{ fontFamily: 'Inter_700Bold' }}
            >
              {formatNgn(totalNumeric)}
            </Text>
          </View>
        </Card>

        {error ? (
          <View className="bg-danger-soft rounded-md mt-4 px-3 py-2.5 flex-row items-center gap-2">
            <Icon name="alert-triangle" size={14} color="#DC2626" />
            <Text
              className="text-danger text-sm flex-1"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <BottomBar>
        <Button
          label={`Confirm & Pay \u00B7 ${formatNgn(totalNumeric)}`}
          onPress={place}
          loading={busy}
          fullWidth
        />
      </BottomBar>
    </Screen>
  );
}
