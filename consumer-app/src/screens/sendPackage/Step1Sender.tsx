import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Icon, Input } from '../../ui';
import { BottomBar } from '../../ui/BottomBar';
import { useSendPackage } from '../../store/sendPackage';
import { getMe } from '../../services/api';
import { isValidNgPhone, normalizeNgPhone } from '../../utils/phone';
import StepShell from './StepShell';
import type { SendPackageStackParamList } from '../../navigation/SendPackageNavigator';

type Props = NativeStackScreenProps<SendPackageStackParamList, 'Step1Sender'>;

export default function Step1Sender({ navigation }: Props) {
  const draft = useSendPackage((s) => s.draft);
  const set = useSendPackage((s) => s.set);
  const reset = useSendPackage((s) => s.reset);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getMe();
        if (!mounted) return;
        const profile = me.profile;
        set({
          senderName: draft.senderName || profile?.fullName || '',
          senderPhone:
            draft.senderPhone ||
            (profile?.phoneNumber ? normalizeNgPhone(profile.phoneNumber) || '' : ''),
          pickupAddress:
            draft.pickupAddress || profile?.defaultAddress || '',
          pickupLatitude:
            draft.pickupLatitude || profile?.defaultLatitude || undefined,
          pickupLongitude:
            draft.pickupLongitude || profile?.defaultLongitude || undefined,
        });
      } catch {
        // Best-effort prefill; user can still type values manually.
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const validPhone = isValidNgPhone(draft.senderPhone);
  const canContinue =
    draft.senderName.trim().length > 1 &&
    validPhone &&
    draft.pickupAddress.trim().length > 4;

  return (
    <StepShell
      step={1}
      title="Sender details"
      subtitle="Confirm pickup info. We auto-fill from your account."
      bottomBar={
        <BottomBar>
          <Button
            label="Continue"
            fullWidth
            disabled={!canContinue}
            onPress={() => navigation.navigate('Step2Recipient')}
          />
        </BottomBar>
      }
    >
      <Card padding="md">
        <View className="flex-row items-center gap-3 mb-3">
          <View
            className="h-10 w-10 rounded-full bg-accent-soft items-center justify-center"
          >
            <Icon name="user" size={18} color="#0B1C2C" />
          </View>
          <Text
            className="text-text font-semi"
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            Your details
          </Text>
        </View>
        <Input
          label="Full name"
          placeholder="Adaobi Okonkwo"
          value={draft.senderName}
          onChangeText={(v) => set({ senderName: v })}
          autoCapitalize="words"
        />
        <View className="h-3" />
        <Input
          label="Phone number"
          placeholder="+234 803 000 0000"
          value={draft.senderPhone}
          onChangeText={(v) => set({ senderPhone: v })}
          keyboardType="phone-pad"
          error={draft.senderPhone && !validPhone ? 'Use a valid +234 number' : null}
        />
      </Card>

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
            Pickup location
          </Text>
        </View>
        <Input
          label="Pickup address"
          placeholder="e.g. 12 Oba Akinjobi Way, Ikeja GRA"
          value={draft.pickupAddress}
          onChangeText={(v) => set({ pickupAddress: v })}
          multiline
        />
        <Text
          className="text-muted text-xs mt-2"
          style={{ fontFamily: 'Inter_400Regular' }}
        >
          Pickup is auto-filled from your saved default address. You can edit it
          for this delivery.
        </Text>
      </Card>

      <View className="flex-row justify-end">
        <Button
          variant="ghost"
          size="sm"
          label="Reset draft"
          onPress={() => reset()}
        />
      </View>

      {!loaded ? (
        <Text className="text-muted text-xs text-center">
          Loading your saved details...
        </Text>
      ) : null}
    </StepShell>
  );
}
