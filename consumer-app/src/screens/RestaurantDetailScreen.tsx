import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getMenu, getRestaurant } from '../services/api';
import type { MenuItem, Restaurant } from '../services/types';
import { useCart } from '../store/cart';
import MenuItemRow from '../components/MenuItemRow';
import { Screen, Loader, Badge, BottomBar, Button, Icon } from '../ui';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'RestaurantDetail'>;

const BANNER_FALLBACK =
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=70';

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
  const [favorited, setFavorited] = useState(false);

  const toggleFavorite = () => {
    setFavorited((v) => {
      const next = !v;
      const message = next ? 'Saved to favorites' : 'Removed from favorites';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Alert.alert(message);
      }
      return next;
    });
  };

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
      <Screen>
        <Loader fullscreen label="Loading menu..." />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        data={menu}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        renderItem={({ item }) => (
          <MenuItemRow
            menuItem={item}
            inCart={lines[item.id]?.quantity ?? 0}
            onAdd={() => add(item)}
          />
        )}
        ListHeaderComponent={
          <View className="-mx-5 mb-4">
            <View className="relative">
              <Image
                source={{ uri: BANNER_FALLBACK }}
                style={{ width: '100%', aspectRatio: 16 / 9 }}
                resizeMode="cover"
              />
              <View
                pointerEvents="none"
                className="absolute inset-x-0 bottom-0 h-24 bg-black/30"
              />
              <Pressable
                onPress={() => navigation.canGoBack() && navigation.goBack()}
                hitSlop={12}
                className="absolute top-3 left-4 h-10 w-10 rounded-full bg-surface items-center justify-center shadow-md"
              >
                <Icon name="arrow-left" size={18} color="#0B1C2C" />
              </Pressable>
              <Pressable
                onPress={toggleFavorite}
                hitSlop={12}
                className="absolute top-3 right-4 h-10 w-10 rounded-full bg-surface items-center justify-center shadow-md"
              >
                <Icon
                  name="heart"
                  size={18}
                  color={favorited ? '#DC2626' : '#0B1C2C'}
                />
              </Pressable>
            </View>
            <View className="px-5 pt-4">
              <Text
                className="text-text text-2xl"
                style={{ fontFamily: 'Inter_700Bold' }}
              >
                {restaurant?.name}
              </Text>
              <View className="flex-row items-center mt-2 gap-2">
                <Badge label={'\u2605 4.8 (320)'} tone="primary" />
                <Badge label={'10\u201315 min drone'} tone="gold" />
              </View>
              <Text
                className="text-muted text-xs mt-2"
                style={{ fontFamily: 'Inter_400Regular' }}
              >
                {restaurant?.address}
              </Text>
              {error ? (
                <View className="bg-danger-soft rounded-md mt-3 px-3 py-2.5">
                  <Text
                    className="text-danger text-sm"
                    style={{ fontFamily: 'Inter_500Medium' }}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}
              <Text
                className="text-text text-base mt-5 mb-1"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              >
                Menu
              </Text>
            </View>
          </View>
        }
      />

      {totalCount > 0 ? (
        <BottomBar>
          <Button
            label={`View cart (${totalCount}) \u00B7 \u20A6${totalAmount.toLocaleString()}`}
            onPress={() =>
              navigation.getParent()?.navigate('CartTab', {
                screen: 'Cart',
                params: { restaurantId },
              })
            }
            fullWidth
          />
        </BottomBar>
      ) : null}
    </Screen>
  );
}
