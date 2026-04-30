import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BRAND_GOLD, BRAND_NAME, BRAND_TAGLINE, BRAND_VENDOR } from './brand';

type Variant = 'compact' | 'splash';

interface BrandWordmarkProps {
  variant?: Variant;
  subtitle?: string;
  showVendorBadge?: boolean;
}

/**
 * Queen Vendor Console wordmark. Same visual system as the consumer app
 * with an optional "Vendor" affordance for ops clarity.
 */
export function BrandWordmark({
  variant = 'compact',
  subtitle,
  showVendorBadge = false,
}: BrandWordmarkProps) {
  const tagline = showVendorBadge ? BRAND_VENDOR : BRAND_TAGLINE;

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
          {tagline}
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
          {subtitle ?? tagline}
        </Text>
      </View>
    </View>
  );
}

export default BrandWordmark;
