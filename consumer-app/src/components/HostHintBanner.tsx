import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

function shouldWarn(): boolean {
  if (Platform.OS === 'web') return false;
  if (!API_URL) return true;
  return /(?:^|\/\/)(localhost|127\.0\.0\.1)(?::|\/|$)/i.test(API_URL);
}

export default function HostHintBanner() {
  if (!shouldWarn()) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        EXPO_PUBLIC_API_URL is unset or points to localhost. Set it to your Mac LAN IP (for
        example http://10.0.0.57:3000/api/v1) in consumer-app/.env, then restart Expo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: { color: '#78350f', fontSize: 12 },
});
