import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  useSignIn,
  useSignUp,
  useOAuth,
} from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Card, Button, Input, Icon } from '../ui';
import { isValidNgPhone, normalizeNgPhone } from '../utils/phone';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'signin' | 'signup';
type IdentifierKind = 'email' | 'phone';

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
  const { startOAuthFlow: startGoogle } = useOAuth({
    strategy: 'oauth_google',
  });
  const { startOAuthFlow: startApple } = useOAuth({
    strategy: 'oauth_apple',
  });

  const [mode, setMode] = useState<AuthMode>('signin');
  const [idKind, setIdKind] = useState<IdentifierKind>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState<
    null | 'email' | 'phone' | 'reset'
  >(null);
  const [code, setCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setBusyAndError = (b: boolean, e?: string | null) => {
    setBusy(b);
    if (e !== undefined) setError(e);
  };

  const handleEmailSignIn = async () => {
    if (!signInLoaded) return;
    setBusyAndError(true, null);
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

  const handleEmailSignUp = async () => {
    if (!signUpLoaded) return;
    setBusyAndError(true, null);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification('email');
    } catch (err) {
      setError((err as Error).message || 'Sign-up failed');
    } finally {
      setBusy(false);
    }
  };

  const handlePhoneStart = async () => {
    const normalized = normalizeNgPhone(phone);
    if (!normalized) {
      setError('Enter a valid Nigerian number, e.g. +234 803 000 0000');
      return;
    }
    setBusyAndError(true, null);
    try {
      if (mode === 'signin') {
        if (!signInLoaded) return;
        const attempt = await signIn.create({
          strategy: 'phone_code',
          identifier: normalized,
        });
        if (attempt.status !== 'needs_first_factor') {
          await signIn.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId:
              attempt.supportedFirstFactors?.find(
                (f: any) => f.strategy === 'phone_code',
              )?.phoneNumberId ?? '',
          });
        }
        setPendingVerification('phone');
      } else {
        if (!signUpLoaded) return;
        await signUp.create({ phoneNumber: normalized });
        await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
        setPendingVerification('phone');
      }
    } catch (err) {
      setError((err as Error).message || 'Could not send code');
    } finally {
      setBusy(false);
    }
  };

  const handlePhoneVerify = async () => {
    setBusyAndError(true, null);
    try {
      if (mode === 'signin') {
        if (!signInLoaded) return;
        const attempt = await signIn.attemptFirstFactor({
          strategy: 'phone_code',
          code,
        });
        if (attempt.status === 'complete') {
          await setSignInActive({ session: attempt.createdSessionId });
        } else {
          setError('Verification incomplete');
        }
      } else {
        if (!signUpLoaded) return;
        const attempt = await signUp.attemptPhoneNumberVerification({ code });
        if (attempt.status === 'complete') {
          await setSignUpActive({ session: attempt.createdSessionId });
        } else {
          setError('Verification incomplete');
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const handleEmailVerify = async () => {
    if (!signUpLoaded) return;
    setBusyAndError(true, null);
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

  const handleOAuth = async (
    starter: typeof startGoogle,
    label: string,
  ) => {
    setBusyAndError(true, null);
    try {
      const result = await starter();
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
      }
    } catch (err) {
      setError((err as Error).message || `${label} sign-in failed`);
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!signInLoaded) return;
    if (!resetEmail.trim()) return;
    setBusyAndError(true, null);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: resetEmail.trim(),
      });
      Alert.alert(
        'Reset email sent',
        `Check ${resetEmail.trim()} for a password reset link.`,
      );
      setPendingVerification(null);
    } catch (err) {
      setError((err as Error).message || 'Could not send reset email');
    } finally {
      setBusy(false);
    }
  };

  const isVerifyEmail = pendingVerification === 'email';
  const isVerifyPhone = pendingVerification === 'phone';
  const isReset = pendingVerification === 'reset';

  return (
    <View className="flex-1 bg-bg">
      <StatusBar style="light" />
      <View className="bg-primary pt-16 pb-12 px-6 rounded-b-3xl">
        <SafeAreaView edges={['top']}>
          <Text
            className="text-accent text-xs tracking-widest"
            style={{ fontFamily: 'Inter_600SemiBold', letterSpacing: 2 }}
          >
            SKYRUNNER
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
              {isVerifyEmail
                ? 'Verify your email'
                : isVerifyPhone
                  ? 'Verify your number'
                  : isReset
                    ? 'Reset password'
                    : mode === 'signin'
                      ? 'Welcome back'
                      : 'Create account'}
            </Text>
            <Text
              className="text-muted text-sm mb-5"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {isVerifyEmail
                ? 'Enter the 6-digit code we sent to your email.'
                : isVerifyPhone
                  ? 'Enter the SMS code we just sent.'
                  : isReset
                    ? "We'll email you a code to set a new password."
                    : mode === 'signin'
                      ? 'Sign in to your Queen account.'
                      : 'Get started with Queen.'}
            </Text>

            {isVerifyEmail || isVerifyPhone ? (
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
                    onPress={
                      isVerifyEmail ? handleEmailVerify : handlePhoneVerify
                    }
                    loading={busy}
                    fullWidth
                  />
                </View>
                <Pressable
                  onPress={() => {
                    setPendingVerification(null);
                    setCode('');
                  }}
                  className="mt-3"
                >
                  <Text
                    className="text-muted text-xs text-center"
                    style={{ fontFamily: 'Inter_500Medium' }}
                  >
                    Use a different method
                  </Text>
                </Pressable>
              </>
            ) : isReset ? (
              <>
                <Input
                  label="Email"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <View className="mt-5">
                  <Button
                    label="Send reset email"
                    onPress={handleForgotPassword}
                    loading={busy}
                    fullWidth
                  />
                </View>
                <Pressable
                  onPress={() => setPendingVerification(null)}
                  className="mt-3"
                >
                  <Text
                    className="text-muted text-xs text-center"
                    style={{ fontFamily: 'Inter_500Medium' }}
                  >
                    Back to sign in
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View className="flex-row p-1 rounded-full bg-cream mb-4">
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

                <View className="flex-row p-1 rounded-md bg-cream mb-4">
                  {(['email', 'phone'] as const).map((k) => {
                    const active = idKind === k;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => setIdKind(k)}
                        className={`flex-1 py-2 rounded-md items-center ${
                          active ? 'bg-surface shadow-sm' : 'bg-transparent'
                        }`}
                      >
                        <Text
                          className={`text-xs ${active ? 'text-text' : 'text-muted'}`}
                          style={{
                            fontFamily: active
                              ? 'Inter_600SemiBold'
                              : 'Inter_500Medium',
                          }}
                        >
                          {k === 'email' ? 'Email + password' : 'Phone (+234)'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {idKind === 'email' ? (
                  <>
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
                    {mode === 'signin' ? (
                      <Pressable
                        onPress={() => {
                          setPendingVerification('reset');
                          setResetEmail(email);
                        }}
                        className="mt-2 self-end"
                      >
                        <Text
                          className="text-primary text-xs"
                          style={{ fontFamily: 'Inter_600SemiBold' }}
                        >
                          Forgot password?
                        </Text>
                      </Pressable>
                    ) : null}
                    <View className="mt-5">
                      <Button
                        label={mode === 'signin' ? 'Sign in' : 'Sign up'}
                        onPress={
                          mode === 'signin'
                            ? handleEmailSignIn
                            : handleEmailSignUp
                        }
                        loading={busy}
                        fullWidth
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Input
                      label="Phone (Nigeria)"
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+234 803 000 0000"
                      keyboardType="phone-pad"
                      error={
                        phone && !isValidNgPhone(phone)
                          ? 'Use a valid +234 number'
                          : null
                      }
                    />
                    <View className="mt-5">
                      <Button
                        label={
                          mode === 'signin'
                            ? 'Send sign-in code'
                            : 'Send sign-up code'
                        }
                        onPress={handlePhoneStart}
                        loading={busy}
                        fullWidth
                      />
                    </View>
                  </>
                )}

                <View className="flex-row items-center my-5 gap-3">
                  <View className="flex-1 h-px bg-hairline" />
                  <Text
                    className="text-muted text-xs"
                    style={{ fontFamily: 'Inter_500Medium' }}
                  >
                    or continue with
                  </Text>
                  <View className="flex-1 h-px bg-hairline" />
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => handleOAuth(startGoogle, 'Google')}
                    className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg border border-border bg-surface"
                  >
                    <Icon name="mail" size={16} color="#0B1C2C" />
                    <Text
                      className="text-text text-sm"
                      style={{ fontFamily: 'Inter_600SemiBold' }}
                    >
                      Google
                    </Text>
                  </Pressable>
                  {Platform.OS === 'ios' ? (
                    <Pressable
                      onPress={() => handleOAuth(startApple, 'Apple')}
                      className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg bg-primary"
                    >
                      <Icon name="user" size={16} color="#FFFFFF" />
                      <Text
                        className="text-white text-sm"
                        style={{ fontFamily: 'Inter_600SemiBold' }}
                      >
                        Apple
                      </Text>
                    </Pressable>
                  ) : null}
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
            By continuing, you agree to Queen&apos;s Terms and Privacy Policy.
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
