'use client';

import type { Drone, Order, OrderStatus } from './types';

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const DEV_BEARER = process.env.NEXT_PUBLIC_DEV_BEARER ?? 'dev-token';

export type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function configureApiClient(tokenGetter: TokenGetter) {
  getToken = tokenGetter;
}

async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (await getToken()) ?? DEV_BEARER;
  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchOrders() {
  return authedFetch<Order[]>('/orders');
}
export function fetchDrones() {
  return authedFetch<Drone[]>('/drones');
}
export function patchOrderStatus(id: string, status: OrderStatus) {
  return authedFetch<Order>(`/orders/${id}/status/${status}`, { method: 'PATCH' });
}
