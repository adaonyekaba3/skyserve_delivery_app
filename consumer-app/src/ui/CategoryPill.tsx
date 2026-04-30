import React from 'react';
import { Pressable, Text } from 'react-native';

interface CategoryPillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function CategoryPill({ label, active = false, onPress }: CategoryPillProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 px-4 py-2 rounded-full border ${
        active
          ? 'bg-primary border-primary'
          : 'bg-surface border-border'
      }`}
    >
      <Text
        className={`${active ? 'text-white' : 'text-text'} text-sm font-medium`}
        style={{ fontFamily: active ? 'Inter_600SemiBold' : 'Inter_500Medium' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default CategoryPill;
