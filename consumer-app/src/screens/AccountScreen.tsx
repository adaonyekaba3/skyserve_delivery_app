import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import {
  Screen,
  AppHeader,
  Card,
  Badge,
  Button,
  Loader,
  Icon,
  type IconName,
} from '../ui';
import { useRole } from '../auth/useRole';
import { useOrders } from '../store/orders';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const DEV_AUTH_BYPASS = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true';

function looksLocalHost(): boolean {
  if (Platform.OS === 'web') return false;
  if (!API_URL) return true;
  return /(?:^|\/\/)(localhost|127\.0\.0\.1)(?::|\/|$)/i.test(API_URL);
}

interface SettingsRowProps {
  icon: IconName;
  label: string;
  hint?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingsRow({
  icon,
  label,
  hint,
  onPress,
  destructive,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-1 py-3.5 border-b border-hairline active:opacity-60"
    >
      <View
        className={`h-9 w-9 rounded-full items-center justify-center mr-3 ${
          destructive ? 'bg-danger-soft' : 'bg-primary-soft'
        }`}
      >
        <Icon
          name={icon}
          size={16}
          color={destructive ? '#DC2626' : '#0B1C2C'}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-base ${destructive ? 'text-danger' : 'text-text'}`}
          style={{ fontFamily: 'Inter_500Medium' }}
        >
          {label}
        </Text>
        {hint ? (
          <Text
            className="text-muted text-xs mt-0.5"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            {hint}
          </Text>
        ) : null}
      </View>
      <Icon name="chevron-right" size={18} color="#94A3B8" />
    </Pressable>
  );
}

interface MetricProps {
  icon: IconName;
  label: string;
  value: string;
}

function Metric({ icon, label, value }: MetricProps) {
  return (
    <View className="flex-1 items-start">
      <View className="flex-row items-center gap-1.5 mb-1">
        <Icon name={icon} size={12} color="#C6A052" />
        <Text
          className="text-subtle text-[11px]"
          style={{ fontFamily: 'Inter_500Medium', letterSpacing: 0.5 }}
        >
          {label.toUpperCase()}
        </Text>
      </View>
      <Text
        className="text-text text-base"
        style={{ fontFamily: 'Inter_700Bold' }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  CUSTOMER: 'Customer',
  RESTAURANT_OWNER: 'Restaurant owner',
  OPERATIONS: 'Operations',
  SUPPORT: 'Support',
};

export default function AccountScreen() {
  const { signOut, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { user, role, loading } = useRole();
  const orders = useOrders((s) => Object.values(s.byId));

  const totalOrders = orders.length;
  const droneDeliveries = orders.filter((o) => o.status === 'DELIVERED').length;
  const memberSince = useMemo(() => {
    const d = clerkUser?.createdAt ? new Date(clerkUser.createdAt) : null;
    if (!d) return '\u2014';
    return d.toLocaleString('en-NG', { month: 'short', year: 'numeric' });
  }, [clerkUser?.createdAt]);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const displayEmail =
    user?.email ??
    clerkUser?.primaryEmailAddress?.emailAddress ??
    (DEV_AUTH_BYPASS ? 'dev@skyserve.local' : '\u2014');
  const displayName =
    clerkUser?.fullName ??
    clerkUser?.firstName ??
    user?.email?.split('@')[0] ??
    'Queen member';
  const displayRole = role ? (ROLE_LABELS[role] ?? role) : 'Customer';

  return (
    <Screen edges={['top', 'left', 'right']} scroll={false}>
      <AppHeader title="Account" variant="large" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <Card className="mb-4" padding="lg">
          <View className="flex-row items-center">
            <View className="h-14 w-14 rounded-full bg-primary items-center justify-center mr-3">
              <Text
                className="text-accent text-lg"
                style={{ fontFamily: 'Inter_700Bold' }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-text text-lg"
                style={{ fontFamily: 'Inter_700Bold' }}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text
                className="text-muted text-sm mt-0.5"
                style={{ fontFamily: 'Inter_400Regular' }}
                numberOfLines={1}
              >
                {displayEmail}
              </Text>
              <View className="mt-2">
                <Badge label={displayRole} tone="primary" size="sm" />
              </View>
            </View>
          </View>
          {loading ? (
            <View className="mt-3">
              <Loader />
            </View>
          ) : null}
        </Card>

        <Card className="mb-4" padding="lg">
          <View className="flex-row gap-4">
            <Metric
              icon="file-text"
              label="Orders"
              value={String(totalOrders)}
            />
            <Metric
              icon="navigation"
              label="Drone runs"
              value={String(droneDeliveries)}
            />
            <Metric icon="clock" label="Member" value={memberSince} />
          </View>
        </Card>

        <Card padding="none" className="mb-4">
          <View className="px-4 pt-3 pb-1">
            <Text
              className="text-subtle text-xs"
              style={{ fontFamily: 'Inter_600SemiBold', letterSpacing: 1 }}
            >
              SETTINGS
            </Text>
          </View>
          <View className="px-4">
            <SettingsRow
              icon="map-pin"
              label="Saved addresses"
              hint="Manage delivery locations"
            />
            <SettingsRow
              icon="credit-card"
              label="Payment methods"
              hint="Cards, bank, mobile money"
            />
            <SettingsRow
              icon="bell"
              label="Notifications"
              hint="Push and email preferences"
            />
            <SettingsRow icon="help-circle" label="Help & support" />
          </View>
        </Card>

        {looksLocalHost() || DEV_AUTH_BYPASS ? (
          <Card className="mb-4 border-warning bg-warning-soft" padding="md">
            <Text
              className="text-warning text-xs mb-1"
              style={{ fontFamily: 'Inter_700Bold', letterSpacing: 1 }}
            >
              DEV MODE
            </Text>
            <Text
              className="text-text text-xs leading-5"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {looksLocalHost()
                ? 'EXPO_PUBLIC_API_URL is unset or points to localhost. Set it to your Mac LAN IP (e.g. http://10.0.0.57:3000/api/v1) and restart Expo.'
                : null}
              {looksLocalHost() && DEV_AUTH_BYPASS ? '\n\n' : ''}
              {DEV_AUTH_BYPASS
                ? 'EXPO_PUBLIC_DEV_AUTH_BYPASS=true: Clerk sign-in is bypassed, using dev bearer token.'
                : null}
            </Text>
          </Card>
        ) : null}

        <Button
          label={isSignedIn ? 'Sign out' : 'Reset session'}
          onPress={handleSignOut}
          variant="danger"
          icon={<Icon name="log-out" size={16} color="#FFFFFF" />}
          fullWidth
        />

        <Text
          className="text-subtle text-xs text-center mt-6"
          style={{ fontFamily: 'Inter_400Regular' }}
        >
          {'Queen by Atelier \u00C9lev\u00E9 \u00B7 v1.0.0'}
        </Text>
      </ScrollView>
    </Screen>
  );
}
