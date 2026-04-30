import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoaderProps {
  label?: string;
  fullscreen?: boolean;
  className?: string;
}

export function Loader({
  label,
  fullscreen = false,
  className = '',
}: LoaderProps) {
  return (
    <View
      className={`items-center justify-center ${
        fullscreen ? 'flex-1 bg-bg' : 'py-8'
      } ${className}`}
    >
      <ActivityIndicator color="#1E3A8A" />
      {label ? (
        <Text
          className="text-muted text-sm mt-3"
          style={{ fontFamily: 'Inter_400Regular' }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export default Loader;
