import axios, { AxiosInstance } from 'axios';
import type { AuthedUser, MenuItem, Order, OrderStatus, Restaurant } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export type TokenGetter = () => Promise<string | null>;
let getToken: TokenGetter = async () => null;
export function configureApi(tokenGetter: TokenGetter) {
  getToken = tokenGetter;
}

const client: AxiosInstance = axios.create({ baseURL: API_URL, timeout: 15000 });
client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const apiBaseUrl = API_URL;

export async function getMe(): Promise<AuthedUser> {
  const { data } = await client.get<{ user: AuthedUser }>('/identity/me');
  return data.user;
}

export async function getRestaurantOrders(restaurantId: string): Promise<Order[]> {
  const { data } = await client.get<Order[]>(`/orders/by-restaurant/${restaurantId}`);
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

export async function getRestaurant(id: string): Promise<Restaurant> {
  const { data } = await client.get<Restaurant>(`/restaurants/${id}`);
  return data;
}

export async function updateRestaurant(
  id: string,
  input: Partial<{ name: string; address: string; latitude: string; longitude: string }>,
): Promise<Restaurant> {
  const { data } = await client.patch<Restaurant>(`/restaurants/${id}`, input);
  return data;
}

export async function getMenu(restaurantId: string): Promise<MenuItem[]> {
  const { data } = await client.get<MenuItem[]>(`/restaurants/${restaurantId}/menu`);
  return data;
}

export async function createMenuItem(input: {
  restaurantId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: string;
  isAvailable?: boolean;
}): Promise<MenuItem> {
  const { data } = await client.post<MenuItem>('/restaurants/menu', input);
  return data;
}

export async function updateMenuItem(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    imageUrl: string;
    price: string;
    isAvailable: boolean;
  }>,
): Promise<MenuItem> {
  const { data } = await client.patch<MenuItem>(`/restaurants/menu/${id}`, input);
  return data;
}

export async function deleteMenuItem(id: string): Promise<{ ok: boolean }> {
  const { data } = await client.delete<{ ok: boolean }>(`/restaurants/menu/${id}`);
  return data;
}

export default client;
