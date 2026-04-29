import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { configureApi } from './src/services/api';
import { configureRealtime } from './src/services/realtime';
import { bootstrapNotifications } from './src/services/notifications';
import RootNavigator from './src/navigation/RootNavigator';
import HostHintBanner from './src/components/HostHintBanner';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
const DEV_BEARER = process.env.EXPO_PUBLIC_DEV_BEARER ?? 'dev-token';

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      /* noop */
    }
  },
};

function ApiBootstrap({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  useEffect(() => {
    const tokenGetter = async () => {
      try {
        return (await getToken()) ?? DEV_BEARER;
      } catch {
        return DEV_BEARER;
      }
    };
    configureApi(tokenGetter);
    configureRealtime(tokenGetter);
    void bootstrapNotifications();
  }, [getToken]);
  return <>{children}</>;
}

export default function App() {
  if (!PUBLISHABLE_KEY) console.warn('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set');
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ApiBootstrap>
        <StatusBar style="dark" />
        <HostHintBanner />
        <RootNavigator />
      </ApiBootstrap>
    </ClerkProvider>
  );
}
