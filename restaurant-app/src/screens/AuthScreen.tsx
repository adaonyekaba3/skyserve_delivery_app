import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Card, Button, Input } from '../ui';

export default function AuthScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async () => {
    if (!isLoaded) return;
    setBusy(true);
    setError(null);
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
      } else {
        setError('Sign-in incomplete');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <StatusBar style="light" />
      <View className="bg-primary pt-16 pb-12 px-6 rounded-b-3xl">
        <SafeAreaView edges={['top']}>
          <Text
            className="text-accent text-xs"
            style={{ fontFamily: 'Inter_600SemiBold', letterSpacing: 2 }}
          >
            SKYSERVE FOR RESTAURANTS
          </Text>
          <Text
            className="text-white text-3xl mt-2"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            Run your kitchen,{'\n'}we handle delivery.
          </Text>
          <Text
            className="text-white/80 text-sm mt-3"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Accept orders, update status, and let drones do the running.
          </Text>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Card padding="lg" className="-mt-8">
            <Text
              className="text-text text-xl mb-1"
              style={{ fontFamily: 'Inter_700Bold' }}
            >
              Sign in
            </Text>
            <Text
              className="text-muted text-sm mb-5"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              Use your restaurant owner account.
            </Text>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="owner@restaurant.com"
              containerClassName="mb-4"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            />

            <View className="mt-5">
              <Button label="Sign in" onPress={handle} loading={busy} fullWidth />
            </View>

            {error ? (
              <View className="bg-danger-soft rounded-md mt-4 px-3 py-2.5">
                <Text className="text-danger text-sm" style={{ fontFamily: 'Inter_500Medium' }}>
                  {error}
                </Text>
              </View>
            ) : null}
          </Card>

          <Text
            className="text-subtle text-xs text-center mt-6"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Need an account? Reach out to the SkyServe ops team.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
