export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PICKED_UP'
  | 'IN_FLIGHT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  totalAmount: string;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface Drone {
  id: string;
  code: string;
  status: 'IDLE' | 'DELIVERING' | 'CHARGING' | 'MAINTENANCE';
  batteryPct: number;
  currentLatitude: string | null;
  currentLongitude: string | null;
  activeDeliveryId: string | null;
}
