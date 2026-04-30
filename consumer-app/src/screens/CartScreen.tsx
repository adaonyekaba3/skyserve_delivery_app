import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCart } from '../store/cart';
import {
  Screen,
  AppHeader,
  Card,
  Button,
  BottomBar,
  EmptyState,
  Icon,
  type IconName,
} from '../ui';
import type { CartStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<CartStackParamList, 'Cart'>;

function QtyButton({
  iconName,
  onPress,
  disabled,
}: {
  iconName: IconName;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      className={`h-8 w-8 rounded-full items-center justify-center ${
        disabled ? 'bg-hairline' : 'bg-surface'
      }`}
    >
      <Icon
        name={iconName}
        size={16}
        color={disabled ? '#94A3B8' : '#0B1C2C'}
      />
    </Pressable>
  );
}

export default function CartScreen({ navigation, route }: Props) {
  const lines = useCart((s) => Object.values(s.lines));
  const total = useCart((s) => s.totalAmount());
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const restaurantId = route.params?.restaurantId ?? lines[0]?.menuItem.restaurantId;

  if (!lines.length) {
    return (
      <Screen>
        <AppHeader title="Your cart" showBack />
        <EmptyState
          icon={<Icon name="shopping-cart" size={28} color="#0B1C2C" />}
          title="Your cart is empty"
          description="Browse restaurants and add a few favorites to get started."
          ctaLabel="Browse restaurants"
          onCta={() =>
            navigation.getParent()?.navigate('HomeTab', { screen: 'Home' })
          }
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader
        title="Your cart"
        subtitle={`${lines.length} item${lines.length > 1 ? 's' : ''}`}
        showBack
      />
      <FlatList
        data={lines}
        keyExtractor={(l) => l.menuItem.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
        renderItem={({ item }) => (
          <Card className="mb-4" padding="lg">
            <View className="flex-row items-start">
              <View className="flex-1 pr-3">
                <Text
                  className="text-text text-base"
                  style={{ fontFamily: 'Inter_600SemiBold' }}
                  numberOfLines={2}
                >
                  {item.menuItem.name}
                </Text>
                <Text
                  className="text-muted text-xs mt-1"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  {`\u20A6${Number(item.menuItem.price).toLocaleString()} each`}
                </Text>
                <Text
                  className="text-text text-base mt-2"
                  style={{ fontFamily: 'Inter_700Bold' }}
                >
                  {`\u20A6${(Number(item.menuItem.price) * item.quantity).toLocaleString()}`}
                </Text>
              </View>
              <View className="items-end">
                <Pressable
                  onPress={() => remove(item.menuItem.id)}
                  hitSlop={10}
                  className="mb-3 h-8 w-8 rounded-full items-center justify-center bg-danger-soft active:opacity-60"
                >
                  <Icon name="trash-2" size={16} color="#DC2626" />
                </Pressable>
                <View className="flex-row items-center bg-primary-soft rounded-full p-1">
                  <QtyButton
                    iconName="minus"
                    onPress={() =>
                      setQuantity(item.menuItem.id, Math.max(0, item.quantity - 1))
                    }
                  />
                  <Text
                    className="text-primary text-base mx-3"
                    style={{ fontFamily: 'Inter_700Bold' }}
                  >
                    {item.quantity}
                  </Text>
                  <QtyButton
                    iconName="plus"
                    onPress={() => setQuantity(item.menuItem.id, item.quantity + 1)}
                  />
                </View>
              </View>
            </View>
          </Card>
        )}
        ListFooterComponent={
          <Card padding="lg" className="mt-1">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-muted text-sm"
                style={{ fontFamily: 'Inter_500Medium' }}
              >
                Subtotal
              </Text>
              <Text
                className="text-text text-base"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              >
                {`\u20A6${total.toLocaleString()}`}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mt-2.5">
              <View className="flex-row items-center gap-1.5">
                <Icon name="check-circle" size={14} color="#16A34A" />
                <Text
                  className="text-muted text-sm"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  Drone delivery
                </Text>
              </View>
              <Text
                className="text-success text-sm"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              >
                Free
              </Text>
            </View>
          </Card>
        }
      />

      <BottomBar>
        <View className="flex-row items-center justify-between mb-3">
          <Text
            className="text-muted text-sm"
            style={{ fontFamily: 'Inter_500Medium' }}
          >
            Total
          </Text>
          <Text
            className="text-text text-lg"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            {`\u20A6${total.toLocaleString()}`}
          </Text>
        </View>
        <Button
          label="Proceed to checkout"
          onPress={() =>
            restaurantId && navigation.navigate('Checkout', { restaurantId })
          }
          fullWidth
          disabled={!restaurantId}
        />
      </BottomBar>
    </Screen>
  );
}
