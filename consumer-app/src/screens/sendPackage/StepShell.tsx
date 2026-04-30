import React from 'react';
import { ScrollView, View } from 'react-native';
import { AppHeader, Screen } from '../../ui';
import ProgressIndicator from './ProgressIndicator';

const STEP_LABELS = [
  'Sender details',
  'Recipient',
  'Package',
  'Delivery',
  'Review & send',
];

interface StepShellProps {
  step: number;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  bottomBar?: React.ReactNode;
}

export function StepShell({
  step,
  title,
  subtitle,
  children,
  bottomBar,
}: StepShellProps) {
  return (
    <Screen scroll={false} keyboardAvoiding bg="bg">
      <AppHeader showBack title={title} subtitle={subtitle} />
      <ProgressIndicator step={step} total={5} labels={STEP_LABELS} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 28,
          gap: 14,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 14 }}>{children}</View>
      </ScrollView>
      {bottomBar}
    </Screen>
  );
}

export default StepShell;
