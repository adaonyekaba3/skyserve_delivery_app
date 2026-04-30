import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
  edges?: Edge[];
  keyboardAvoiding?: boolean;
  bg?: 'bg' | 'surface' | 'primary';
}

export function Screen({
  children,
  scroll = false,
  className = '',
  contentClassName = '',
  edges = ['top', 'left', 'right'],
  keyboardAvoiding = false,
  bg = 'bg',
}: ScreenProps) {
  const bgClass = bg === 'primary' ? 'bg-primary' : bg === 'surface' ? 'bg-surface' : 'bg-bg';
  const statusStyle = bg === 'primary' ? 'light' : 'dark';

  const inner = scroll ? (
    <ScrollView
      className={`flex-1 ${contentClassName}`}
      contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 ${contentClassName}`}>{children}</View>
  );

  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    <SafeAreaView edges={edges} className={`flex-1 ${bgClass} ${className}`}>
      <StatusBar style={statusStyle} />
      {body}
    </SafeAreaView>
  );
}

export default Screen;
