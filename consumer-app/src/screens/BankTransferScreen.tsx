import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AppHeader,
  Badge,
  BottomBar,
  Button,
  Card,
  Icon,
  Screen,
} from '../ui';
import { submitBankProof, uploadBankProof } from '../services/api';
import {
  notifyBankTransferPending,
} from '../services/notifications';
import type { CartStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<CartStackParamList, 'BankTransfer'>;

export default function BankTransferScreen({ navigation, route }: Props) {
  const { paymentId, orderId, instructions, flow } = route.params;
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onUpload = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'We need access to your photos to upload proof.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const base64 = asset.base64;
      if (!base64) {
        Alert.alert('Upload failed', 'Could not read image data.');
        return;
      }

      setUploading(true);
      setError(null);
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const safeExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? ext : 'jpg';
      const uploaded = await uploadBankProof({
        fileBase64: base64,
        extension: safeExt,
      });
      setProofUrl(uploaded.url);
      await submitBankProof({ paymentId, proofUrl: uploaded.url });
      setSubmitted(true);
      void notifyBankTransferPending();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ?? (err as Error).message;
      setError(msg ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onContinue = () => {
    if (flow === 'package') {
      navigation.popToTop();
      navigation.getParent()?.navigate('MainTabs');
    } else {
      navigation.replace('OrderTracking', { orderId });
    }
  };

  return (
    <Screen scroll={false}>
      <AppHeader showBack title="Bank transfer" subtitle="Pay via Providus" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card padding="md">
          <View className="flex-row items-center gap-2 mb-3">
            <Badge tone="warning" label="Awaiting transfer" />
          </View>
          <Text
            className="text-text"
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16 }}
          >
            Send {instructions.currency} {instructions.amount}
          </Text>
          <Text
            className="text-muted text-sm mt-1"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Open your bank app and use the details below.
          </Text>
        </Card>

        <Card padding="md">
          <Row label="Bank" value={instructions.bankName} />
          <Row label="Account name" value={instructions.accountName} />
          <Row label="Account number" value={instructions.accountNumber} mono />
          <Row
            label="Reference / narration"
            value={instructions.reference}
            mono
            highlight
          />
          <Text
            className="text-muted text-xs mt-2"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            {instructions.note}
          </Text>
        </Card>

        <Card padding="md">
          <Text
            className="text-text font-semi mb-2"
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            Proof of payment
          </Text>
          <Text
            className="text-muted text-xs mb-3"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Upload a screenshot from your bank app once the transfer is sent.
          </Text>
          <Button
            label={
              submitted
                ? 'Replace proof screenshot'
                : 'Upload proof screenshot'
            }
            variant={submitted ? 'secondary' : 'primary'}
            fullWidth
            loading={uploading}
            onPress={onUpload}
            icon={<Icon name="upload" size={16} color={submitted ? '#0B1C2C' : '#FFFFFF'} />}
          />
          {submitted && proofUrl ? (
            <View className="mt-3 flex-row items-center gap-2">
              <Icon name="check-circle" size={16} color="#16A34A" />
              <Text
                className="text-success text-sm flex-1"
                style={{ fontFamily: 'Inter_500Medium' }}
              >
                Proof uploaded. We are verifying your payment.
              </Text>
            </View>
          ) : null}
          {error ? (
            <Text
              className="text-danger text-sm mt-3"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              {error}
            </Text>
          ) : null}
        </Card>

        <Card padding="md" className="bg-accent-soft border-accent">
          <View className="flex-row items-start gap-3">
            <Icon name="info" size={18} color="#0B1C2C" />
            <Text
              className="text-text text-xs flex-1"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              Your drone will be dispatched as soon as our team confirms the
              transfer (usually within a few minutes during business hours).
              You will get a push notification when it's verified.
            </Text>
          </View>
        </Card>
      </ScrollView>

      <BottomBar>
        <Button
          label={submitted ? 'Continue tracking' : 'I have uploaded proof'}
          fullWidth
          disabled={!submitted}
          onPress={onContinue}
        />
      </BottomBar>
    </Screen>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-2 ${highlight ? 'bg-accent-soft px-3 rounded-md' : ''}`}
    >
      <Text
        className="text-muted text-xs"
        style={{ fontFamily: 'Inter_500Medium' }}
      >
        {label}
      </Text>
      <Text
        className="text-text"
        style={{
          fontFamily: mono ? 'Inter_700Bold' : 'Inter_500Medium',
          fontSize: mono ? 16 : 14,
          letterSpacing: mono ? 0.6 : 0,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
