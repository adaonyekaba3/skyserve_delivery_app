import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showBack?: boolean;
  variant?: 'default' | 'large';
}

export function AppHeader({
  title,
  subtitle,
  left,
  right,
  showBack = false,
  variant = 'default',
}: AppHeaderProps) {
  const navigation = useNavigation<any>();

  const backButton = showBack ? (
    <Pressable
      onPress={() => navigation.canGoBack() && navigation.goBack()}
      hitSlop={12}
      className="h-10 w-10 items-center justify-center rounded-full bg-surface border border-border"
    >
      <Text className="text-primary text-xl">{'\u2039'}</Text>
    </Pressable>
  ) : null;

  return (
    <View className="px-5 pt-2 pb-3">
      <View className="flex-row items-center justify-between min-h-[44px]">
        <View className="flex-row items-center gap-2">
          {left ?? backButton}
        </View>
        <View className="flex-row items-center gap-2">{right}</View>
      </View>

      {title ? (
        <View className={variant === 'large' ? 'mt-2' : 'mt-1'}>
          <Text
            className={`text-text font-bold ${
              variant === 'large' ? 'text-3xl' : 'text-xl'
            }`}
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="text-muted text-sm mt-1"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default AppHeader;
