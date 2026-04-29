import axios, { AxiosInstance } from 'axios';
import type {
  AuthedUser,
  MenuItem,
  Order,
  OrderStatus,
  PaymentInitialization,
  PaymentProvider,
  Restaurant,
} from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function configureApi(tokenGetter: TokenGetter) {
  getToken = tokenGetter;
}

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiBaseUrl = API_URL;

export async function getMe(): Promise<AuthedUser> {
  const { data } = await client.get<{ user: AuthedUser }>('/identity/me');
  return data.user;
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
  const { data } = await client.get<MenuItem[]>(`/restaurants/${restaurantId}/menu`);
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

export async function patchOrderStatus(id: string, status: OrderStatus): Promise<Order> {
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
}): Promise<PaymentInitialization> {
  const { data } = await client.post<PaymentInitialization>('/payments/initialize', input);
  return data;
}

export default client;
