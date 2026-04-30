import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo';
import { getRestaurants } from '../services/api';
import type { Restaurant } from '../services/types';
import RestaurantCard from '../components/RestaurantCard';
import { useRecentRestaurants } from '../hooks/useRecentRestaurants';
import {
  Screen,
  Input,
  Card,
  CategoryPill,
  LocationDropdown,
  Skeleton,
  EmptyState,
  Icon,
  Button,
} from '../ui';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const CATEGORIES = ['All', 'Nigerian', 'Fast Food', 'Healthy', 'Drinks'];
const DEV_AUTH_BYPASS = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true';

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

async function fetchRestaurantsWithRetry(): Promise<Restaurant[]> {
  const attempts = [0, 800, 1600];
  let lastErr: unknown;
  for (let i = 0; i < attempts.length; i++) {
    if (attempts[i] > 0) {
      await new Promise((r) => setTimeout(r, attempts[i]));
    }
    try {
      return await getRestaurants();
    } catch (err) {
      lastErr = err;
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const isRetryable = !status || status >= 500;
      if (!isRetryable) break;
    }
  }
  throw lastErr;
}

function HomeHeader({
  location,
  onLocationChange,
  onProfilePress,
  greeting,
  firstName,
}: {
  location: string;
  onLocationChange: (v: string) => void;
  onProfilePress: () => void;
  greeting: string;
  firstName: string;
}) {
  return (
    <View className="px-5 pt-2 pb-1">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 rounded-full bg-primary items-center justify-center">
            <Text
              className="text-accent text-lg"
              style={{ fontFamily: 'Inter_700Bold' }}
            >
              S
            </Text>
          </View>
          <Text
            className="text-text text-lg"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            SkyServe
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <LocationDropdown value={location} onChange={onLocationChange} />
          <Pressable
            onPress={onProfilePress}
            hitSlop={10}
            className="h-9 w-9 rounded-full bg-primary-soft items-center justify-center"
          >
            <Icon name="user" size={18} color="#0B1C2C" />
          </Pressable>
        </View>
      </View>
      <View className="mt-3 flex-row items-center gap-1.5">
        <Icon name="map-pin" size={13} color="#0B1C2C" />
        <Text
          className="text-primary text-sm"
          style={{ fontFamily: 'Inter_600SemiBold' }}
        >
          {location}
        </Text>
      </View>
      <Text
        className="text-text text-2xl mt-1"
        style={{ fontFamily: 'Inter_700Bold' }}
      >
        {`${greeting}, ${firstName}`}
      </Text>
    </View>
  );
}

function CardSkeleton() {
  return (
    <Card padding="none" className="mb-4 overflow-hidden">
      <Skeleton width="100%" height={180} rounded="sm" />
      <View className="p-4">
        <Skeleton width="60%" height={18} className="mb-2" />
        <Skeleton width="40%" height={12} className="mb-2" />
        <Skeleton width="80%" height={12} />
      </View>
    </Card>
  );
}

export default function HomeScreen(_props: Props) {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const [items, setItems] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('Ikoyi');

  const firstName = user?.firstName ?? (DEV_AUTH_BYPASS ? 'Adaobi' : 'there');
  const greeting = greetingFor(new Date().getHours());

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchRestaurantsWithRetry();
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q),
    );
  }, [items, search]);

  const recentIds = useRecentRestaurants();
  const recommended = useMemo(() => {
    if (recentIds.length === 0) return filtered.slice(0, 5);
    const byId = new Map(filtered.map((r) => [r.id, r] as const));
    const ordered = recentIds
      .map((id) => byId.get(id))
      .filter((r): r is Restaurant => Boolean(r));
    return ordered.length > 0 ? ordered : filtered.slice(0, 5);
  }, [filtered, recentIds]);
  const hasRecents =
    recentIds.length > 0 && recommended.some((r) => recentIds.includes(r.id));

  const notifyMeWhenLive = useCallback(() => {
    Alert.alert(
      'You\u2019re on the list',
      `We\u2019ll notify you the moment Skyrunner goes live in ${location}.`,
    );
  }, [location]);

  return (
    <Screen contentClassName="px-0">
      <HomeHeader
        location={location}
        onLocationChange={setLocation}
        onProfilePress={() =>
          navigation.getParent()?.navigate('AccountTab', { screen: 'Account' })
        }
        greeting={greeting}
        firstName={firstName}
      />

      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() =>
              navigation.navigate('RestaurantDetail', { restaurantId: item.id })
            }
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <Text
              className="text-text text-2xl mt-3 mb-1"
              style={{ fontFamily: 'Inter_700Bold' }}
            >
              {'What\u2019s for delivery?'}
            </Text>
            <Text
              className="text-muted text-sm mb-4"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {'Drone delivery in 10\u201315 minutes.'}
            </Text>

            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search for restaurants or meals"
              autoCapitalize="none"
              leftIcon={<Icon name="search" size={16} color="#64748B" />}
              containerClassName="mb-4"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4 -mx-1"
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {CATEGORIES.map((c) => (
                <CategoryPill
                  key={c}
                  label={c}
                  active={category === c}
                  onPress={() => setCategory(c)}
                />
              ))}
            </ScrollView>

            {!loading && !error && recommended.length > 0 ? (
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text
                    className="text-text text-base"
                    style={{ fontFamily: 'Inter_600SemiBold' }}
                  >
                    {hasRecents ? 'Reorder favorites' : 'Recommended for you'}
                  </Text>
                  <Text
                    className="text-muted text-xs"
                    style={{ fontFamily: 'Inter_500Medium' }}
                  >
                    Premium picks
                  </Text>
                </View>
                <FlatList
                  horizontal
                  data={recommended}
                  keyExtractor={(r) => `rec-${r.id}`}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <RestaurantCard
                      restaurant={item}
                      onPress={() =>
                        navigation.navigate('RestaurantDetail', {
                          restaurantId: item.id,
                        })
                      }
                      compact
                    />
                  )}
                />
              </View>
            ) : null}

            <Text
              className="text-text text-base mb-3"
              style={{ fontFamily: 'Inter_600SemiBold' }}
            >
              Restaurants near you
            </Text>

            {loading ? (
              <View>
                <CardSkeleton />
                <CardSkeleton />
              </View>
            ) : null}

            {error ? (
              <Card className="mb-4 flex-row items-center justify-between">
                <Text
                  className="text-danger text-sm flex-1 mr-3"
                  style={{ fontFamily: 'Inter_500Medium' }}
                  numberOfLines={2}
                >
                  {error}
                </Text>
                <Button
                  label="Retry"
                  variant="ghost"
                  size="sm"
                  onPress={load}
                  icon={<Icon name="refresh-cw" size={14} color="#0B1C2C" />}
                />
              </Card>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon={<Icon name="bell" size={26} color="#0B1C2C" />}
              title="No delivery partners available yet"
              description="We\u2019re onboarding premium vendors in your area. Check back shortly."
              ctaLabel="Refresh"
              onCta={load}
              secondaryCtaLabel="Notify Me When Live"
              onSecondaryCta={notifyMeWhenLive}
            />
          )
        }
        refreshControl={
          <RefreshControl
            tintColor="#0B1C2C"
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      />
    </Screen>
  );
}
