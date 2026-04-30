import './global.css';
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { configureApi } from './src/services/api';
import { configureRealtime } from './src/services/realtime';
import { bootstrapNotifications } from './src/services/notifications';
import RootNavigator from './src/navigation/RootNavigator';

void SplashScreen.preventAutoHideAsync().catch(() => {});

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
  if (!PUBLISHABLE_KEY) {
    console.warn('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set');
  }

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View className="flex-1" onLayout={onLayoutRootView}>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
          <ApiBootstrap>
            <RootNavigator />
          </ApiBootstrap>
        </ClerkProvider>
      </View>
    </SafeAreaProvider>
  );
}
