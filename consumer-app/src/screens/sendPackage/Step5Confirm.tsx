import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Icon } from '../../ui';
import { BottomBar } from '../../ui/BottomBar';
import { useSendPackage } from '../../store/sendPackage';
import {
  createPackage,
  quotePackage,
  type CreatePackageInput,
} from '../../services/api';
import type { PackagePriceBreakdown } from '../../services/types';
import { formatNgDisplay, normalizeNgPhone } from '../../utils/phone';
import { computeLocalQuote } from '../../utils/packagePricing';
import StepShell from './StepShell';
import type { SendPackageStackParamList } from '../../navigation/SendPackageNavigator';
import { useNavigation } from '@react-navigation/native';

type Props = NativeStackScreenProps<
  SendPackageStackParamList,
  'Step5Confirm'
>;

const formatNgn = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

export default function Step5Confirm({ navigation }: Props) {
  const draft = useSendPackage((s) => s.draft);
  const reset = useSendPackage((s) => s.reset);
  const [pricing, setPricing] = useState<PackagePriceBreakdown>(() =>
    computeLocalQuote(draft.weightClass, draft.deliveryPriority),
  );
  const [pricingSource, setPricingSource] = useState<'local' | 'server'>(
    'local',
  );
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const rootNav = useNavigation<any>();

  const fetchQuote = useCallback(async () => {
    setLoadingQuote(true);
    setQuoteError(null);
    setPricing(computeLocalQuote(draft.weightClass, draft.deliveryPriority));
    try {
      const q = await quotePackage({
        weightClass: draft.weightClass,
        deliveryPriority: draft.deliveryPriority,
      });
      setPricing(q);
      setPricingSource('server');
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ??
        (err as Error).message ??
        'Network error';
      console.warn('[sendPackage] quote failed; using local estimate', err);
      setQuoteError(msg);
      setPricingSource('local');
    } finally {
      setLoadingQuote(false);
    }
  }, [draft.weightClass, draft.deliveryPriority]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!mounted) return;
      await fetchQuote();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchQuote]);

  const onSend = async () => {
    if (!pricing) return;
    const phone = normalizeNgPhone(draft.recipientPhone);
    if (!phone) {
      Alert.alert(
        'Invalid recipient phone',
        'Please go back to step 2 and enter a valid Nigerian number.',
      );
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreatePackageInput = {
        recipientPhone: phone,
        recipientName: draft.recipientName?.trim() || undefined,
        category: draft.category,
        weightClass: draft.weightClass,
        deliveryPriority: draft.deliveryPriority,
        isFragile: draft.isFragile,
        description: draft.description?.trim() || undefined,
        pickupAddress: draft.pickupAddress,
        pickupLatitude: draft.pickupLatitude,
        pickupLongitude: draft.pickupLongitude,
        dropoffAddress: draft.dropoffAddress,
        dropoffLatitude: draft.dropoffLatitude,
        dropoffLongitude: draft.dropoffLongitude,
      };
      const result = await createPackage(payload);
      reset();
      rootNav.navigate('PackageTracking', {
        packageId: result.package.id,
        trackingToken: result.package.trackingToken,
        orderId: result.order.id,
        amount: result.order.totalAmount,
      });
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ?? (err as Error).message;
      Alert.alert('Could not send package', msg ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepShell
      step={5}
      title="Review & confirm"
      subtitle="One last look. We'll prepare a drone immediately."
      bottomBar={
        <BottomBar>
          <Button
            label="Send package"
            fullWidth
            loading={submitting}
            disabled={submitting}
            onPress={onSend}
            icon={<Icon name="send" size={18} color="#FFFFFF" />}
          />
        </BottomBar>
      }
    >
      <Card padding="md">
        <Text
          className="text-text font-semi mb-3"
          style={{ fontFamily: 'Inter_600SemiBold' }}
        >
          Summary
        </Text>
        <SummaryRow label="Recipient" value={formatNgDisplay(draft.recipientPhone)} />
        {draft.recipientName ? (
          <SummaryRow label="Recipient name" value={draft.recipientName} />
        ) : null}
        <SummaryRow label="Pickup" value={draft.pickupAddress} />
        <SummaryRow label="Drop-off" value={draft.dropoffAddress} />
        <SummaryRow
          label="Item"
          value={`${draft.category.toUpperCase()} • ${draft.weightClass}${draft.isFragile ? ' • fragile' : ''}`}
        />
        {draft.description ? (
          <SummaryRow label="Description" value={draft.description} />
        ) : null}
        <SummaryRow
          label="Speed"
          value={
            draft.deliveryPriority === 'priority'
              ? 'Priority drone'
              : 'Standard drone'
          }
        />
      </Card>

      <Card padding="md">
        <View className="flex-row items-center justify-between mb-3">
          <Text
            className="text-text font-semi"
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            Pricing
          </Text>
          {loadingQuote ? (
            <Text
              className="text-muted text-xs"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              Calculating...
            </Text>
          ) : null}
        </View>
        <View style={{ gap: 6 }}>
          <PriceRow label="Base fee" value={formatNgn(pricing.baseFee)} />
          {pricing.weightSurcharge > 0 ? (
            <PriceRow
              label={`Weight (${draft.weightClass})`}
              value={`+ ${formatNgn(pricing.weightSurcharge)}`}
            />
          ) : null}
          {pricing.prioritySurcharge > 0 ? (
            <PriceRow
              label="Priority dispatch"
              value={`+ ${formatNgn(pricing.prioritySurcharge)}`}
            />
          ) : null}
          <View className="h-px bg-hairline my-1" />
          <PriceRow
            label="Total"
            value={formatNgn(pricing.total)}
            emphasis
          />
          <Text
            className="text-muted text-xs mt-1"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            ETA {pricing.estimatedMinutes} minutes after dispatch.
          </Text>
        </View>
        {quoteError ? (
          <View
            className="mt-3 flex-row items-center justify-between"
            style={{ gap: 8 }}
          >
            <Text
              className="text-muted text-xs flex-1"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              Showing estimated fee. Live quote unavailable
              {__DEV__ ? `: ${quoteError}` : '.'}
            </Text>
            <Pressable
              onPress={fetchQuote}
              disabled={loadingQuote}
              hitSlop={8}
              className="flex-row items-center"
              style={{ gap: 4, opacity: loadingQuote ? 0.5 : 1 }}
            >
              <Icon name="refresh-cw" size={14} color="#0B1C2C" />
              <Text
                className="text-text text-xs"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              >
                Retry
              </Text>
            </Pressable>
          </View>
        ) : pricingSource === 'local' && !loadingQuote ? (
          <Text
            className="text-muted text-xs mt-2"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Estimated fee.
          </Text>
        ) : null}
      </Card>

      <Card padding="md" className="bg-accent-soft border-accent">
        <View className="flex-row items-start gap-3">
          <Icon name="shield" size={18} color="#0B1C2C" />
          <Text
            className="text-text text-xs flex-1"
            style={{ fontFamily: 'Inter_500Medium' }}
          >
            By sending, you confirm the contents are not restricted and the
            drop-off address is correct. Queen is not liable for restricted or
            undeclared items.
          </Text>
        </View>
      </Card>
    </StepShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row mb-2">
      <Text
        className="text-muted text-xs"
        style={{ fontFamily: 'Inter_500Medium', width: 110 }}
      >
        {label}
      </Text>
      <Text
        className="text-text text-sm flex-1"
        style={{ fontFamily: 'Inter_500Medium' }}
      >
        {value}
      </Text>
    </View>
  );
}

function PriceRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className={emphasis ? 'text-text' : 'text-muted'}
        style={{
          fontFamily: emphasis ? 'Inter_700Bold' : 'Inter_500Medium',
          fontSize: emphasis ? 16 : 13,
        }}
      >
        {label}
      </Text>
      <Text
        className="text-text"
        style={{
          fontFamily: emphasis ? 'Inter_700Bold' : 'Inter_500Medium',
          fontSize: emphasis ? 18 : 13,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
