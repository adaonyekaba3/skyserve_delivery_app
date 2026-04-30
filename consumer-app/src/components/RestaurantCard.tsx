import React from 'react';
import { Text, View, Image } from 'react-native';
import type { Restaurant } from '../services/types';
import { Card, Badge, Button } from '../ui';

interface Props {
  restaurant: Restaurant;
  onPress: () => void;
  imageUrl?: string;
  cuisine?: string;
  rating?: number;
  etaMinutes?: string;
  compact?: boolean;
}

const PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=70',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=70',
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=900&q=70',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=70',
];

function pickImage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PLACEHOLDERS[hash % PLACEHOLDERS.length];
}

export default function RestaurantCard({
  restaurant,
  onPress,
  imageUrl,
  cuisine = 'Mixed cuisine',
  rating = 4.7,
  etaMinutes = '10-15 min',
  compact = false,
}: Props) {
  const banner = imageUrl ?? pickImage(restaurant.id);

  if (compact) {
    return (
      <Card
        onPress={onPress}
        padding="none"
        className="mr-3 overflow-hidden"
        style={{ width: 240 }}
      >
        <View className="relative">
          <Image
            source={{ uri: banner }}
            style={{ width: '100%', aspectRatio: 16 / 9 }}
            resizeMode="cover"
          />
          <View className="absolute top-2 right-2">
            <Badge label={`${etaMinutes}`} tone="gold" />
          </View>
        </View>
        <View className="p-3">
          <Text
            className="text-text text-base"
            style={{ fontFamily: 'Inter_700Bold' }}
            numberOfLines={1}
          >
            {restaurant.name}
          </Text>
          <Text
            className="text-muted text-xs mt-0.5"
            style={{ fontFamily: 'Inter_400Regular' }}
            numberOfLines={1}
          >
            {`${cuisine} \u00B7 \u2605 ${rating.toFixed(1)}`}
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={onPress} padding="none" className="mb-4 overflow-hidden">
      <View className="relative">
        <Image
          source={{ uri: banner }}
          style={{ width: '100%', aspectRatio: 16 / 9 }}
          resizeMode="cover"
        />
        <View className="absolute top-3 right-3">
          <Badge label={`\u2691 ${etaMinutes} drone`} tone="gold" />
        </View>
      </View>
      <View className="p-4">
        <Text
          className="text-text text-lg"
          style={{ fontFamily: 'Inter_700Bold' }}
          numberOfLines={1}
        >
          {restaurant.name}
        </Text>
        <View className="flex-row items-center mt-1">
          <Text
            className="text-muted text-xs"
            style={{ fontFamily: 'Inter_400Regular' }}
            numberOfLines={1}
          >
            {`${cuisine} \u00B7 \u2605 ${rating.toFixed(1)}`}
          </Text>
        </View>
        <Text
          className="text-subtle text-xs mt-1"
          style={{ fontFamily: 'Inter_400Regular' }}
          numberOfLines={1}
        >
          {restaurant.address}
        </Text>
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center">
            <View className="h-2 w-2 rounded-full bg-success mr-1.5" />
            <Text
              className="text-success text-xs"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              Open now
            </Text>
          </View>
          <Button
            label="View menu"
            size="sm"
            variant="secondary"
            onPress={onPress}
          />
        </View>
      </View>
    </Card>
  );
}
