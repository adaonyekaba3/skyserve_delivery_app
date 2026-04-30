import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

const variantBg: Record<Variant, string> = {
  primary: 'bg-primary active:bg-primary-hover',
  secondary: 'bg-primary-soft',
  ghost: 'bg-transparent',
  gold: 'bg-accent',
  danger: 'bg-danger',
};

const variantText: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-primary',
  ghost: 'text-primary',
  gold: 'text-text',
  danger: 'text-white',
};

const sizeClass: Record<Size, string> = {
  sm: 'py-2 px-4',
  md: 'py-3 px-5',
  lg: 'py-4 px-6',
};

const sizeText: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const widthClass = fullWidth ? 'w-full' : '';
  const opacityClass = isDisabled ? 'opacity-60' : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${variantBg[variant]} ${sizeClass[size]} ${widthClass} ${opacityClass} rounded-lg items-center justify-center flex-row ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger' ? '#fff' : '#0B1C2C'
          }
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text
            className={`${variantText[variant]} ${sizeText[size]} font-semi`}
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default Button;
