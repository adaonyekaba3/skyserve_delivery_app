import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Card, Button, Input, Icon } from '../ui';

export default function AuthScreen() {
  const {
    isLoaded: signInLoaded,
    signIn,
    setActive: setSignInActive,
  } = useSignIn();
  const {
    isLoaded: signUpLoaded,
    signUp,
    setActive: setSignUpActive,
  } = useSignUp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!signInLoaded) return;
    setBusy(true);
    setError(null);
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === 'complete') {
        await setSignInActive({ session: attempt.createdSessionId });
      } else {
        setError('Sign-in needs more steps; check your email.');
      }
    } catch (err) {
      setError((err as Error).message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpLoaded) return;
    setBusy(true);
    setError(null);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      setError((err as Error).message || 'Sign-up failed');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!signUpLoaded) return;
    setBusy(true);
    setError(null);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === 'complete') {
        await setSignUpActive({ session: attempt.createdSessionId });
      } else {
        setError('Verification incomplete');
      }
    } catch (err) {
      setError((err as Error).message || 'Verification failed');
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
            className="text-accent text-xs tracking-widest"
            style={{ fontFamily: 'Inter_600SemiBold', letterSpacing: 2 }}
          >
            SKYSERVE
          </Text>
          <Text
            className="text-white text-3xl mt-2"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            Drone-fast delivery,{'\n'}from your favorites.
          </Text>
          <Text
            className="text-white/80 text-sm mt-3"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Sign in to start ordering in 10-15 minutes.
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
              {pendingVerification
                ? 'Verify your email'
                : mode === 'signin'
                  ? 'Welcome back'
                  : 'Create account'}
            </Text>
            <Text
              className="text-muted text-sm mb-5"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {pendingVerification
                ? 'Enter the 6-digit code we sent to your email.'
                : mode === 'signin'
                  ? 'Sign in to your SkyServe account.'
                  : 'Get started with SkyServe.'}
            </Text>

            {pendingVerification ? (
              <>
                <Input
                  label="Verification code"
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />
                <View className="mt-5">
                  <Button
                    label="Verify"
                    onPress={handleVerify}
                    loading={busy}
                    fullWidth
                  />
                </View>
              </>
            ) : (
              <>
                <View className="flex-row p-1 rounded-full bg-cream mb-5">
                  {(['signin', 'signup'] as const).map((m) => {
                    const active = mode === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setMode(m)}
                        className={`flex-1 py-2 rounded-full items-center ${
                          active ? 'bg-accent' : 'bg-transparent'
                        }`}
                      >
                        <Text
                          className={`text-sm ${active ? 'text-primary' : 'text-muted'}`}
                          style={{
                            fontFamily: active
                              ? 'Inter_700Bold'
                              : 'Inter_500Medium',
                          }}
                        >
                          {m === 'signin' ? 'Sign in' : 'Sign up'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  containerClassName="mb-4"
                />
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder={
                    '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'
                  }
                  secureTextEntry
                />
                <View className="mt-5">
                  <Button
                    label={mode === 'signin' ? 'Sign in' : 'Sign up'}
                    onPress={mode === 'signin' ? handleSignIn : handleSignUp}
                    loading={busy}
                    fullWidth
                  />
                </View>
              </>
            )}

            {error ? (
              <View className="bg-danger-soft rounded-md mt-4 px-3 py-2.5">
                <Text
                  className="text-danger text-sm"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  {error}
                </Text>
              </View>
            ) : null}
          </Card>

          <Text
            className="text-subtle text-xs text-center mt-6"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            By continuing, you agree to SkyServe's Terms and Privacy Policy.
          </Text>

          <View className="flex-row items-center justify-center gap-1.5 mt-3">
            <Icon name="shield" size={12} color="#94A3B8" />
            <Text
              className="text-subtle text-xs text-center"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              Powered by Clerk
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
