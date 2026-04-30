import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Badge, Button, Card, Icon, Input } from '../../ui';
import { BottomBar } from '../../ui/BottomBar';
import { useSendPackage } from '../../store/sendPackage';
import { lookupRecipient } from '../../services/api';
import { isValidNgPhone, normalizeNgPhone } from '../../utils/phone';
import StepShell from './StepShell';
import type { SendPackageStackParamList } from '../../navigation/SendPackageNavigator';

type Props = NativeStackScreenProps<
  SendPackageStackParamList,
  'Step2Recipient'
>;

export default function Step2Recipient({ navigation }: Props) {
  const draft = useSendPackage((s) => s.draft);
  const set = useSendPackage((s) => s.set);
  const setRecipientLookup = useSendPackage((s) => s.setRecipientLookup);
  const [checking, setChecking] = useState(false);
  const validPhone = isValidNgPhone(draft.recipientPhone);

  const onCheckRecipient = async () => {
    if (!validPhone) return;
    setChecking(true);
    try {
      const r = await lookupRecipient(normalizeNgPhone(draft.recipientPhone)!);
      setRecipientLookup(r);
    } catch {
      // Network or 4xx; treat as guest until next attempt.
      setRecipientLookup({
        recipientType: 'guest',
        phone: normalizeNgPhone(draft.recipientPhone) || draft.recipientPhone,
      });
    } finally {
      setChecking(false);
    }
  };

  const lookup = draft.recipientLookup;
  const canContinue = validPhone;

  return (
    <StepShell
      step={2}
      title="Recipient"
      subtitle="Who should receive this package?"
      bottomBar={
        <BottomBar>
          <Button
            label="Continue"
            fullWidth
            disabled={!canContinue}
            onPress={() => navigation.navigate('Step3Package')}
          />
        </BottomBar>
      }
    >
      <Card padding="md">
        <View className="flex-row items-center gap-3 mb-3">
          <View
            className="h-10 w-10 rounded-full bg-accent-soft items-center justify-center"
          >
            <Icon name="phone" size={18} color="#0B1C2C" />
          </View>
          <Text
            className="text-text font-semi"
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            Recipient phone
          </Text>
        </View>
        <Input
          label="Recipient phone (Nigeria)"
          placeholder="+234 803 000 0000"
          value={draft.recipientPhone}
          onChangeText={(v) => {
            set({ recipientPhone: v });
            setRecipientLookup(null);
          }}
          onBlur={onCheckRecipient}
          keyboardType="phone-pad"
          error={
            draft.recipientPhone && !validPhone
              ? 'Use a valid +234 number'
              : null
          }
        />
        <View className="h-3" />
        <Input
          label="Recipient name (optional)"
          placeholder="e.g. Tomi Adesanya"
          value={draft.recipientName}
          onChangeText={(v) => set({ recipientName: v })}
          autoCapitalize="words"
        />
      </Card>

      {validPhone ? (
        <Card padding="md" className="border-accent">
          {checking ? (
            <Text
              className="text-muted text-sm"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              Checking recipient...
            </Text>
          ) : lookup ? (
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <Badge
                  tone={
                    lookup.recipientType === 'user'
                      ? 'success'
                      : lookup.recipientType === 'vendor'
                        ? 'warning'
                        : 'neutral'
                  }
                  label={
                    lookup.recipientType === 'user'
                      ? 'Existing Queen member'
                      : lookup.recipientType === 'vendor'
                        ? 'Vendor / business'
                        : 'New recipient'
                  }
                />
              </View>
              {lookup.recipientType === 'user' ? (
                <Text
                  className="text-text"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  {lookup.name ?? 'Queen member'} will get a push notification
                  when the package is dispatched.
                </Text>
              ) : lookup.recipientType === 'vendor' ? (
                <Text
                  className="text-text"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  Verified vendor at {lookup.address ?? 'their saved address'}.
                </Text>
              ) : (
                <Text
                  className="text-text"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  This number is not on Queen yet. You will get a tracking
                  link to share with the recipient.
                </Text>
              )}
            </View>
          ) : (
            <Button
              variant="secondary"
              label="Check this number"
              onPress={onCheckRecipient}
            />
          )}
        </Card>
      ) : null}

      <Card padding="md" className="bg-accent-soft border-accent">
        <View className="flex-row items-start gap-3">
          <Icon name="info" size={18} color="#0B1C2C" />
          <Text
            className="text-text text-xs flex-1"
            style={{ fontFamily: 'Inter_500Medium' }}
          >
            Restricted items (cash, weapons, illegal goods, hazardous
            materials, fragile electronics without packaging) are not allowed
            and may be refused at pickup.
          </Text>
        </View>
      </Card>
    </StepShell>
  );
}
