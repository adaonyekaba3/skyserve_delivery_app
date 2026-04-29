export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PICKED_UP'
  | 'IN_FLIGHT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  price: string;
  isAvailable: boolean;
}

export interface OrderLine {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: string;
  nameSnapshot: string;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  totalAmount: string;
  deliveryAddress: string;
  deliveryLatitude?: string | null;
  deliveryLongitude?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderLine[];
}

export interface AuthedUser {
  sub: string;
  dbUserId: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER' | 'RESTAURANT_OWNER' | 'OPERATIONS' | 'SUPPORT';
  restaurantIds: string[];
}

export type PaymentProvider = 'STRIPE' | 'PAYSTACK' | 'FLUTTERWAVE';

export interface PaymentInitialization {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerRef: string | null;
  amount: string;
  currency: string;
  status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  authorizationUrl?: string;
}
