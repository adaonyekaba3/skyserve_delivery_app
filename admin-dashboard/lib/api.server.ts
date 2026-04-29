import 'server-only';
import { auth } from '@clerk/nextjs/server';
import type { Drone, Order } from './types';

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const DEV_BEARER = process.env.NEXT_PUBLIC_DEV_BEARER ?? 'dev-token';

async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { getToken } = await auth();
  const token = (await getToken()) ?? DEV_BEARER;
  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchOrders() {
  return authedFetch<Order[]>('/orders');
}

export function fetchDrones() {
  return authedFetch<Drone[]>('/drones');
}
