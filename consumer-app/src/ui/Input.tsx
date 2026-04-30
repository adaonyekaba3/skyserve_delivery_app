import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    containerClassName = '',
    className = '',
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const borderClass = error
    ? 'border-danger'
    : focused
      ? 'border-primary'
      : 'border-border';

  return (
    <View className={`w-full ${containerClassName}`}>
      {label ? (
        <Text
          className="text-text text-sm font-medium mb-1.5"
          style={{ fontFamily: 'Inter_500Medium' }}
        >
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center bg-surface rounded-lg border ${borderClass} px-3.5`}
        style={{ minHeight: 48 }}
      >
        {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor="#94A3B8"
          className={`flex-1 text-text ${className}`}
          style={[
            {
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              paddingVertical: 12,
            },
            (rest as any).style,
          ]}
        />
        {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text
          className="text-danger text-xs mt-1.5"
          style={{ fontFamily: 'Inter_500Medium' }}
        >
          {error}
        </Text>
      ) : helper ? (
        <Text
          className="text-muted text-xs mt-1.5"
          style={{ fontFamily: 'Inter_400Regular' }}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
});

export default Input;
