import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Screen, AppHeader, Card, Badge, Button, Loader } from '../ui';
import { useRole } from '../auth/useRole';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const DEV_AUTH_BYPASS = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true';

function looksLocalHost(): boolean {
  if (Platform.OS === 'web') return false;
  if (!API_URL) return true;
  return /(?:^|\/\/)(localhost|127\.0\.0\.1)(?::|\/|$)/i.test(API_URL);
}

interface SettingsRowProps {
  icon: string;
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
        <Text className="text-base">{icon}</Text>
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
      <Text className="text-subtle text-base">{'\u203A'}</Text>
    </Pressable>
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
    'Restaurant owner';
  const displayRole = role ? (ROLE_LABELS[role] ?? role) : 'Restaurant owner';
  const restaurantCount = user?.restaurantIds?.length ?? 0;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Account" variant="large" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <Card className="mb-4" padding="lg">
          <View className="flex-row items-center">
            <View className="h-14 w-14 rounded-full bg-primary items-center justify-center mr-3">
              <Text
                className="text-white text-lg"
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
              <View className="flex-row gap-2 mt-2">
                <Badge label={displayRole} tone="primary" size="sm" />
                {restaurantCount > 0 ? (
                  <Badge
                    label={`${restaurantCount} restaurant${restaurantCount > 1 ? 's' : ''}`}
                    tone="gold"
                    size="sm"
                  />
                ) : null}
              </View>
            </View>
          </View>
          {loading ? (
            <View className="mt-3">
              <Loader />
            </View>
          ) : null}
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
              icon="\uD83D\uDD14"
              label="Notifications"
              hint="Push and email"
            />
            <SettingsRow
              icon="\uD83D\uDCB3"
              label="Payouts"
              hint="Bank account & history"
            />
            <SettingsRow
              icon="\uD83D\uDCC8"
              label="Reports"
              hint="Daily and weekly stats"
            />
            <SettingsRow icon="\uD83C\uDD98" label="Help & support" />
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
                ? 'EXPO_PUBLIC_API_URL is unset or points to localhost. Set it to your Mac LAN IP and restart Expo.'
                : null}
              {looksLocalHost() && DEV_AUTH_BYPASS ? '\n\n' : ''}
              {DEV_AUTH_BYPASS
                ? 'EXPO_PUBLIC_DEV_AUTH_BYPASS=true: Clerk sign-in is bypassed.'
                : null}
            </Text>
          </Card>
        ) : null}

        <Button
          label={isSignedIn ? 'Sign out' : 'Reset session'}
          onPress={handleSignOut}
          variant="danger"
          fullWidth
        />

        <Text
          className="text-subtle text-xs text-center mt-6"
          style={{ fontFamily: 'Inter_400Regular' }}
        >
          SkyServe for Restaurants \u00B7 v1.0.0
        </Text>
      </ScrollView>
    </Screen>
  );
}
