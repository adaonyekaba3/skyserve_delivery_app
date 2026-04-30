import React from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Screen, AppHeader, EmptyState } from '../ui';

export default function NotAuthorizedScreen() {
  const { signOut } = useAuth();
  return (
    <Screen>
      <AppHeader title="Not authorized" />
      <EmptyState
        icon={'\uD83D\uDD12'}
        title="Restaurant owner access only"
        description="This app is for restaurant owners and admins. Sign out and use the Queen consumer app to order food."
        ctaLabel="Sign out"
        onCta={() => signOut()}
      />
    </Screen>
  );
}
