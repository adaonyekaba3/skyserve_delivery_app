import 'server-only';
import { auth } from '@clerk/nextjs/server';
import type {
  AdminInsights,
  AdminOverview,
  BankTransfer,
  Drone,
  Order,
  Package,
  Vendor,
  VendorPerformance,
} from './types';

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const DEV_BEARER = process.env.NEXT_PUBLIC_DEV_BEARER ?? 'dev-token';

export interface AuthedUser {
  sub: string;
  dbUserId: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER' | 'RESTAURANT_OWNER' | 'OPERATIONS' | 'SUPPORT';
  restaurantIds: string[];
}

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

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await authedFetch<T>(path);
  } catch {
    return fallback;
  }
}

export function fetchOrders() {
  return authedFetch<Order[]>('/orders');
}

export function fetchDrones() {
  return authedFetch<Drone[]>('/drones');
}

export function fetchVendors() {
  return authedFetch<Vendor[]>('/restaurants');
}

export function fetchVendorPerformance(id: string) {
  return authedFetch<VendorPerformance>(`/restaurants/${id}/performance`);
}

const EMPTY_OVERVIEW: AdminOverview = {
  ordersToday: 0,
  ordersWeek: 0,
  ordersMonth: 0,
  activeDeliveries: 0,
  avgDeliveryMinutes: 0,
  motorcycleTripsAvoided: 0,
  activeUsersByZone: {
    Ikoyi: 0,
    'Victoria Island': 0,
    'Lekki Phase 1': 0,
    'Lekki Phase 2': 0,
    'Banana Island': 0,
    'Eko Atlantic': 0,
  },
  unprocessedCount: 0,
};

const EMPTY_INSIGHTS: AdminInsights = {
  motorcycleTripsAvoided: 0,
  estimatedTrafficReductionPct: 0,
  carbonKgSaved: 0,
  droneAdoptionRatePct: 0,
  ordersByDay: [],
};

export function fetchAdminOverview() {
  return safeFetch<AdminOverview>('/admin/overview', EMPTY_OVERVIEW);
}

export function fetchAdminInsights() {
  return safeFetch<AdminInsights>('/admin/insights', EMPTY_INSIGHTS);
}

export async function fetchMe(): Promise<AuthedUser | null> {
  try {
    const data = await authedFetch<{ user: AuthedUser }>('/identity/me');
    return data.user;
  } catch {
    return null;
  }
}

export function fetchPackages() {
  return safeFetch<Package[]>('/packages/all', []);
}

export function fetchBankTransfers(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return safeFetch<BankTransfer[]>(`/bank-transfers${qs}`, []);
}
