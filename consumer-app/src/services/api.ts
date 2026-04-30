import axios, { AxiosInstance } from 'axios';
import type {
  AuthedUser,
  CreatePackageResult,
  DeliveryPriority,
  MenuItem,
  Order,
  OrderStatus,
  PackageCategory,
  PackageRecord,
  PackageView,
  PackageWeightClass,
  PackagePriceBreakdown,
  PaymentInitialization,
  PaymentProvider,
  PaymentStatusView,
  RecipientLookup,
  Restaurant,
  UserProfile,
} from './types';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function configureApi(tokenGetter: TokenGetter) {
  getToken = tokenGetter;
}

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiBaseUrl = API_URL;

export async function getMe(): Promise<{
  user: AuthedUser;
  profile: UserProfile | null;
}> {
  const { data } = await client.get<{
    user: AuthedUser;
    profile: UserProfile | null;
  }>('/identity/me');
  return data;
}

export async function patchMyProfile(
  input: Partial<{
    fullName: string;
    phoneNumber: string;
    defaultAddress: string;
    defaultLatitude: string;
    defaultLongitude: string;
  }>,
): Promise<UserProfile> {
  const { data } = await client.patch<{ profile: UserProfile }>(
    '/identity/me',
    input,
  );
  return data.profile;
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const { data } = await client.get<Restaurant[]>('/restaurants');
  return data;
}

export async function getRestaurant(id: string): Promise<Restaurant> {
  const { data } = await client.get<Restaurant>(`/restaurants/${id}`);
  return data;
}

export async function getMenu(restaurantId: string): Promise<MenuItem[]> {
  const { data } = await client.get<MenuItem[]>(
    `/restaurants/${restaurantId}/menu`,
  );
  return data;
}

export interface CreateOrderInput {
  restaurantId: string;
  deliveryAddress: string;
  deliveryLatitude?: string;
  deliveryLongitude?: string;
  items: Array<{ menuItemId: string; quantity: number }>;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data } = await client.post<Order>('/orders', input);
  return data;
}

export async function getMyOrders(): Promise<Order[]> {
  const { data } = await client.get<Order[]>('/orders/mine');
  return data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await client.get<Order>(`/orders/${id}`);
  return data;
}

export async function patchOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order> {
  const { data } = await client.patch<Order>(`/orders/${id}/status/${status}`);
  return data;
}

export async function initializePayment(input: {
  orderId: string;
  amount: string;
  currency: string;
  callbackUrl: string;
  provider: PaymentProvider;
  idempotencyKey: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
}): Promise<PaymentInitialization> {
  const { data } = await client.post<PaymentInitialization>(
    '/payments/initialize',
    input,
  );
  return data;
}

export async function getPaymentStatus(
  reference: string,
): Promise<PaymentStatusView> {
  const { data } = await client.get<PaymentStatusView>('/payments/status', {
    params: { reference },
  });
  return data;
}

export async function uploadBankProof(input: {
  fileBase64: string;
  extension: string;
}): Promise<{ url: string; filename: string }> {
  const { data } = await client.post<{ url: string; filename: string }>(
    '/payments/uploads/proof',
    input,
  );
  return data;
}

export async function submitBankProof(input: {
  paymentId: string;
  proofUrl: string;
}): Promise<{ id: string; status: string }> {
  const { data } = await client.post<{ id: string; status: string }>(
    '/payments/bank-transfer/proof',
    input,
  );
  return data;
}

// Packages

export async function quotePackage(input: {
  weightClass: PackageWeightClass;
  deliveryPriority: DeliveryPriority;
}): Promise<PackagePriceBreakdown> {
  const { data } = await client.post<PackagePriceBreakdown>(
    '/packages/quote',
    input,
  );
  return data;
}

export async function lookupRecipient(phone: string): Promise<RecipientLookup> {
  const { data } = await client.post<RecipientLookup>(
    '/packages/lookup-recipient',
    { phone },
  );
  return data;
}

export interface CreatePackageInput {
  recipientPhone: string;
  recipientName?: string;
  category: PackageCategory;
  weightClass: PackageWeightClass;
  deliveryPriority: DeliveryPriority;
  isFragile?: boolean;
  description?: string;
  pickupAddress: string;
  pickupLatitude?: string;
  pickupLongitude?: string;
  dropoffAddress: string;
  dropoffLatitude?: string;
  dropoffLongitude?: string;
}

export async function createPackage(
  input: CreatePackageInput,
): Promise<CreatePackageResult> {
  const { data } = await client.post<CreatePackageResult>('/packages', input);
  return data;
}

export async function getMyPackages(): Promise<PackageRecord[]> {
  const { data } = await client.get<PackageRecord[]>('/packages/mine');
  return data;
}

export async function getPackage(id: string): Promise<PackageView> {
  const { data } = await client.get<PackageView>(`/packages/${id}`);
  return data;
}

export async function getPackageByToken(token: string): Promise<PackageView> {
  const { data } = await client.get<PackageView>(`/packages/track/${token}`);
  return data;
}

export default client;
