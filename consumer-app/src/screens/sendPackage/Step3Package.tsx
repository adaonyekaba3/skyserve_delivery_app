import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Icon, Input } from '../../ui';
import { BottomBar } from '../../ui/BottomBar';
import type { IconName } from '../../ui';
import { useSendPackage } from '../../store/sendPackage';
import StepShell from './StepShell';
import type { SendPackageStackParamList } from '../../navigation/SendPackageNavigator';
import type {
  PackageCategory,
  PackageWeightClass,
} from '../../services/types';

type Props = NativeStackScreenProps<
  SendPackageStackParamList,
  'Step3Package'
>;

const CATEGORY_OPTIONS: Array<{
  id: PackageCategory;
  label: string;
  icon: IconName;
}> = [
  { id: 'documents', label: 'Documents', icon: 'file-text' },
  { id: 'food', label: 'Food', icon: 'gift' },
  { id: 'parcel', label: 'Parcel', icon: 'package' },
  { id: 'gift', label: 'Gift', icon: 'heart' },
  { id: 'other', label: 'Other', icon: 'briefcase' },
];

const WEIGHT_OPTIONS: Array<{
  id: PackageWeightClass;
  label: string;
  detail: string;
}> = [
  { id: 'light', label: 'Light', detail: '0 - 2kg' },
  { id: 'medium', label: 'Medium', detail: '2 - 5kg' },
  { id: 'heavy', label: 'Heavy', detail: '5kg+' },
];

interface ChipProps {
  selected: boolean;
  label: string;
  detail?: string;
  iconName?: IconName;
  onPress: () => void;
}

function Chip({ selected, label, detail, iconName, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 px-3 py-3 rounded-lg border ${
        selected ? 'border-accent bg-accent-soft' : 'border-border bg-surface'
      } items-center justify-center`}
      style={{ minHeight: 76 }}
    >
      {iconName ? (
        <Icon
          name={iconName}
          size={18}
          color={selected ? '#0B1C2C' : '#64748B'}
        />
      ) : null}
      <Text
        className={`mt-1 ${selected ? 'text-text' : 'text-muted'}`}
        style={{
          fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_500Medium',
          fontSize: 13,
        }}
      >
        {label}
      </Text>
      {detail ? (
        <Text
          className="text-muted"
          style={{ fontFamily: 'Inter_400Regular', fontSize: 11 }}
        >
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function Step3Package({ navigation }: Props) {
  const draft = useSendPackage((s) => s.draft);
  const set = useSendPackage((s) => s.set);

  const canContinue = draft.description.trim().length >= 3;

  return (
    <StepShell
      step={3}
      title="Package details"
      subtitle="Help us prepare the right drone for the job."
      bottomBar={
        <BottomBar>
          <Button
            label="Continue"
            fullWidth
            disabled={!canContinue}
            onPress={() => navigation.navigate('Step4Delivery')}
          />
        </BottomBar>
      }
    >
      <Card padding="md">
        <Text
          className="text-text font-semi mb-2"
          style={{ fontFamily: 'Inter_600SemiBold' }}
        >
          What are you sending?
        </Text>
        <Input
          placeholder='e.g. "Sealed envelope with legal docs"'
          value={draft.description}
          onChangeText={(v) => set({ description: v })}
          multiline
          numberOfLines={3}
          maxLength={300}
        />
      </Card>

      <Card padding="md">
        <Text
          className="text-text font-semi mb-3"
          style={{ fontFamily: 'Inter_600SemiBold' }}
        >
          Category
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <View key={opt.id} style={{ width: '48%' }}>
              <Chip
                selected={draft.category === opt.id}
                label={opt.label}
                iconName={opt.icon}
                onPress={() => set({ category: opt.id })}
              />
            </View>
          ))}
        </View>
      </Card>

      <Card padding="md">
        <Text
          className="text-text font-semi mb-3"
          style={{ fontFamily: 'Inter_600SemiBold' }}
        >
          Weight
        </Text>
        <View className="flex-row gap-2">
          {WEIGHT_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              selected={draft.weightClass === opt.id}
              label={opt.label}
              detail={opt.detail}
              onPress={() => set({ weightClass: opt.id })}
            />
          ))}
        </View>
      </Card>

      <Card padding="md">
        <Pressable
          onPress={() => set({ isFragile: !draft.isFragile })}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <Icon name="alert-triangle" size={18} color="#0B1C2C" />
            <View>
              <Text
                className="text-text"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              >
                Fragile
              </Text>
              <Text
                className="text-muted text-xs"
                style={{ fontFamily: 'Inter_400Regular' }}
              >
                Handle with extra care
              </Text>
            </View>
          </View>
          <View
            className={`h-6 w-10 rounded-full ${
              draft.isFragile ? 'bg-accent' : 'bg-hairline'
            } justify-center`}
          >
            <View
              className="h-5 w-5 rounded-full bg-surface shadow-sm"
              style={{ marginLeft: draft.isFragile ? 18 : 2 }}
            />
          </View>
        </Pressable>
      </Card>
    </StepShell>
  );
}
