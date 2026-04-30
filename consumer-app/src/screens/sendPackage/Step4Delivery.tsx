import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Icon, Input } from '../../ui';
import { BottomBar } from '../../ui/BottomBar';
import { useSendPackage } from '../../store/sendPackage';
import StepShell from './StepShell';
import type { SendPackageStackParamList } from '../../navigation/SendPackageNavigator';
import type { DeliveryPriority } from '../../services/types';

type Props = NativeStackScreenProps<
  SendPackageStackParamList,
  'Step4Delivery'
>;

const PRIORITY_OPTIONS: Array<{
  id: DeliveryPriority;
  label: string;
  eta: string;
  detail: string;
  delta: string;
}> = [
  {
    id: 'standard',
    label: 'Standard',
    eta: '10 - 15 min',
    detail: 'Optimised drone routing, included in price.',
    delta: 'Included',
  },
  {
    id: 'priority',
    label: 'Priority',
    eta: '6 - 9 min',
    detail: 'Fastest available drone, dispatched immediately.',
    delta: '+₦1,000',
  },
];

export default function Step4Delivery({ navigation }: Props) {
  const draft = useSendPackage((s) => s.draft);
  const set = useSendPackage((s) => s.set);
  const lookup = draft.recipientLookup;

  const canContinue = draft.dropoffAddress.trim().length > 4;

  return (
    <StepShell
      step={4}
      title="Delivery details"
      subtitle="Where should we drop the package?"
      bottomBar={
        <BottomBar>
          <Button
            label="Review & confirm"
            fullWidth
            disabled={!canContinue}
            onPress={() => navigation.navigate('Step5Confirm')}
          />
        </BottomBar>
      }
    >
      <Card padding="md">
        <View className="flex-row items-center gap-3 mb-3">
          <View
            className="h-10 w-10 rounded-full bg-accent-soft items-center justify-center"
          >
            <Icon name="map-pin" size={18} color="#0B1C2C" />
          </View>
          <Text
            className="text-text font-semi"
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            Drop-off location
          </Text>
        </View>
        {lookup?.recipientType === 'user' && lookup.address ? (
          <Text
            className="text-muted text-xs mb-2"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Auto-filled from {lookup.name ?? 'recipient'}'s saved address. Edit
            if needed.
          </Text>
        ) : null}
        <Input
          label="Drop-off address"
          placeholder="e.g. 7B Banana Island Road, Ikoyi"
          value={draft.dropoffAddress}
          onChangeText={(v) => set({ dropoffAddress: v })}
          multiline
        />
      </Card>

      <Card padding="md">
        <Text
          className="text-text font-semi mb-3"
          style={{ fontFamily: 'Inter_600SemiBold' }}
        >
          Delivery speed
        </Text>
        <View style={{ gap: 10 }}>
          {PRIORITY_OPTIONS.map((opt) => {
            const selected = draft.deliveryPriority === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => set({ deliveryPriority: opt.id })}
                className={`px-4 py-3 rounded-lg border ${
                  selected
                    ? 'border-accent bg-accent-soft'
                    : 'border-border bg-surface'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      className={`h-5 w-5 rounded-full border-2 ${
                        selected
                          ? 'border-accent bg-accent'
                          : 'border-border'
                      } items-center justify-center`}
                    >
                      {selected ? (
                        <View className="h-2 w-2 rounded-full bg-surface" />
                      ) : null}
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-text"
                        style={{ fontFamily: 'Inter_600SemiBold' }}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        className="text-muted text-xs"
                        style={{ fontFamily: 'Inter_400Regular' }}
                      >
                        {opt.eta} • {opt.detail}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-text"
                    style={{ fontFamily: 'Inter_600SemiBold' }}
                  >
                    {opt.delta}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </StepShell>
  );
}
