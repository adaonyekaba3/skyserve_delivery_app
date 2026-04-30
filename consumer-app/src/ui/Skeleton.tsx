import React, { useEffect, useRef } from 'react';
import { View, Animated, type ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  style?: ViewStyle;
}

const roundedClass: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export function Skeleton({
  width = '100%',
  height = 16,
  rounded = 'md',
  className = '',
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-hairline ${roundedClass[rounded]} ${className}`}
      style={[{ width: width as any, height, opacity }, style]}
    />
  );
}

export default Skeleton;
