import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

export default function AuthScreen() {
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>SkyServe</Text>
      <Text style={styles.subtitle}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>

      {pendingVerification ? (
        <>
          <Text style={styles.label}>Email verification code</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            style={styles.input}
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={handleVerify} style={styles.primaryBtn} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Verify</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            style={styles.input}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={mode === 'signin' ? handleSignIn : handleSignUp}
            style={styles.primaryBtn}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>{mode === 'signin' ? 'Sign in' : 'Sign up'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}>
            <Text style={styles.toggle}>
              {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 4, color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#475569', marginBottom: 24 },
  label: { fontSize: 13, color: '#475569', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    fontSize: 16,
    color: '#0f172a',
  },
  primaryBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  toggle: { color: '#0f172a', textAlign: 'center', marginTop: 16, fontSize: 14 },
  error: { color: '#b91c1c', marginTop: 16, textAlign: 'center' },
});
