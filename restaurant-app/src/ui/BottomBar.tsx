import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomBarProps {
  children: React.ReactNode;
  className?: string;
}

export function BottomBar({ children, className = '' }: BottomBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={`absolute left-0 right-0 bottom-0 bg-surface border-t border-border px-5 ${className}`}
      style={{ paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {children}
    </View>
  );
}

export default BottomBar;
