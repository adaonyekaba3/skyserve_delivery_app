import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BRAND_GOLD, BRAND_NAME, BRAND_TAGLINE } from './brand';

type Variant = 'compact' | 'splash';

interface BrandWordmarkProps {
  variant?: Variant;
  /** Optional tone-on-tone hint shown beneath the tagline (compact only). */
  subtitle?: string;
}

/**
 * Queen by Atelier Élevé wordmark with a hairline crown glyph.
 *
 * - `compact` is for app headers (crown left, stacked Queen + tagline right).
 * - `splash` is for sign-in / onboarding (large centered crown above wordmark).
 */
export function BrandWordmark({ variant = 'compact', subtitle }: BrandWordmarkProps) {
  if (variant === 'splash') {
    return (
      <View className="items-center" style={{ gap: 10 }}>
        <MaterialCommunityIcons
          name="crown-outline"
          size={36}
          color={BRAND_GOLD}
        />
        <Text
          className="text-text"
          style={{ fontFamily: 'Inter_700Bold', fontSize: 36, letterSpacing: -0.5 }}
        >
          {BRAND_NAME}
        </Text>
        <Text
          className="text-text"
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 11,
            letterSpacing: 2,
            opacity: 0.55,
            textTransform: 'uppercase',
          }}
        >
          {BRAND_TAGLINE}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center" style={{ gap: 8 }}>
      <MaterialCommunityIcons
        name="crown-outline"
        size={20}
        color={BRAND_GOLD}
      />
      <View>
        <Text
          className="text-text"
          style={{ fontFamily: 'Inter_700Bold', fontSize: 18, lineHeight: 20 }}
        >
          {BRAND_NAME}
        </Text>
        <Text
          className="text-text"
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 9,
            letterSpacing: 1.4,
            opacity: 0.55,
            textTransform: 'uppercase',
            marginTop: 1,
          }}
        >
          {subtitle ?? BRAND_TAGLINE}
        </Text>
      </View>
    </View>
  );
}

export default BrandWordmark;
