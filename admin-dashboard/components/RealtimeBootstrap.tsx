'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { configureApiClient } from '@/lib/api.client';
import { configureRealtime } from '@/lib/realtime';

export default function RealtimeBootstrap() {
  const { getToken } = useAuth();

  useEffect(() => {
    const tokenGetter = async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    };
    configureApiClient(tokenGetter);
    configureRealtime(tokenGetter);
  }, [getToken]);

  return null;
}
