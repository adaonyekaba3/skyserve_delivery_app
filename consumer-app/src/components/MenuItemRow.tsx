import React from 'react';
import { Text, View, Image, Pressable } from 'react-native';
import type { MenuItem } from '../services/types';
import { Icon } from '../ui';

interface Props {
  menuItem: MenuItem;
  inCart: number;
  onAdd: () => void;
}

export default function MenuItemRow({ menuItem, inCart, onAdd }: Props) {
  const placeholder =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=70';
  const img = menuItem.imageUrl || placeholder;
  const unavailable = !menuItem.isAvailable;

  return (
    <View className="flex-row items-center py-4 border-b border-hairline">
      <View
        className="rounded-xl overflow-hidden bg-cream"
        style={{
          width: 80,
          height: 80,
          shadowColor: '#0B1C2C',
          shadowOpacity: 0.08,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        <Image
          source={{ uri: img }}
          style={{
            width: 80,
            height: 80,
            opacity: unavailable ? 0.55 : 1,
          }}
          resizeMode="cover"
        />
      </View>
      <View className="flex-1 ml-3">
        <Text
          className="text-text text-base"
          style={{ fontFamily: 'Inter_600SemiBold' }}
          numberOfLines={1}
        >
          {menuItem.name}
        </Text>
        {menuItem.description ? (
          <Text
            className="text-muted text-xs mt-1"
            style={{ fontFamily: 'Inter_400Regular' }}
            numberOfLines={2}
          >
            {menuItem.description}
          </Text>
        ) : null}
        <Text
          className="text-text text-sm mt-1.5"
          style={{ fontFamily: 'Inter_700Bold' }}
        >
          {'\u20A6'}
          {Number(menuItem.price).toLocaleString()}
        </Text>
      </View>

      {unavailable ? (
        <View className="ml-3 h-9 px-3 rounded-lg items-center justify-center border border-hairline bg-transparent">
          <Text
            className="text-subtle text-xs"
            style={{ fontFamily: 'Inter_600SemiBold', letterSpacing: 0.6 }}
          >
            SOLD OUT
          </Text>
        </View>
      ) : inCart > 0 ? (
        <Pressable
          onPress={onAdd}
          className="ml-3 h-10 min-w-[56px] px-3 rounded-full items-center justify-center bg-primary flex-row gap-1.5"
        >
          <Text
            className="text-white text-sm"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            {inCart}
          </Text>
          <Icon name="plus" size={14} color="#FFFFFF" />
        </Pressable>
      ) : (
        <Pressable
          onPress={onAdd}
          className="ml-3 h-10 px-4 rounded-full items-center justify-center bg-primary-soft flex-row gap-1.5"
        >
          <Icon name="plus" size={14} color="#0B1C2C" />
          <Text
            className="text-primary text-sm"
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            Add
          </Text>
        </Pressable>
      )}
    </View>
  );
}
