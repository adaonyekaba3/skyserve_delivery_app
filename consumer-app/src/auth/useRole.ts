import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { getMe } from '../services/api';
import type { AuthedUser } from '../services/types';

const DEV_AUTH_BYPASS = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true';

interface UseRoleResult {
  user: AuthedUser | null;
  role: AuthedUser['role'] | null;
  loading: boolean;
  error: string | null;
  isCustomer: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

export function useRole(): UseRoleResult {
  const { isLoaded, isSignedIn } = useAuth();
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getMe();
      setUser(me);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? err?.message ?? 'Failed to load user',
      );
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn && !DEV_AUTH_BYPASS) {
      setUser(null);
      setLoading(false);
      return;
    }
    void fetchMe();
  }, [isLoaded, isSignedIn, fetchMe]);

  return {
    user,
    role: user?.role ?? null,
    loading,
    error,
    isCustomer: user?.role === 'CUSTOMER',
    isOwner: user?.role === 'RESTAURANT_OWNER',
    isAdmin: user?.role === 'ADMIN',
    refresh: fetchMe,
  };
}

export default useRole;
