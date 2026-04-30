export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PICKED_UP'
  | 'IN_FLIGHT'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderType = 'food' | 'package_delivery';
export type DeliveryPriority = 'standard' | 'priority';

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  category?: string | null;
  location?: string | null;
  isActive?: boolean;
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
  restaurantId: string | null;
  orderType?: OrderType;
  deliveryPriority?: DeliveryPriority;
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

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  defaultAddress?: string | null;
  defaultLatitude?: string | null;
  defaultLongitude?: string | null;
  role: AuthedUser['role'];
}

export type PaymentProvider =
  | 'STRIPE'
  | 'PAYSTACK'
  | 'FLUTTERWAVE'
  | 'BANK_TRANSFER';

export interface BankTransferInstructions {
  bankName: string;
  accountName: string;
  accountNumber: string;
  amount: string;
  currency: string;
  reference: string;
  note: string;
}

export interface PaymentInitialization {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerRef: string | null;
  amount: string;
  currency: string;
  status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  authorizationUrl?: string;
  instructions?: BankTransferInstructions;
}

export interface PaymentStatusView {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerRef: string | null;
  amount: string;
  status: PaymentInitialization['status'];
}

export type PackageCategory =
  | 'documents'
  | 'food'
  | 'parcel'
  | 'gift'
  | 'other';
export type PackageWeightClass = 'light' | 'medium' | 'heavy';
export type RecipientType = 'user' | 'vendor' | 'guest';

export interface PackageRecord {
  id: string;
  orderId: string;
  senderId: string;
  recipientPhone: string;
  recipientId: string | null;
  recipientType: RecipientType;
  recipientName: string | null;
  category: PackageCategory;
  weightClass: PackageWeightClass;
  isFragile: boolean;
  description: string | null;
  pickupAddress: string;
  pickupLatitude: string | null;
  pickupLongitude: string | null;
  dropoffAddress: string;
  dropoffLatitude: string | null;
  dropoffLongitude: string | null;
  trackingToken: string;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PackagePriceBreakdown {
  baseFee: number;
  weightSurcharge: number;
  prioritySurcharge: number;
  total: number;
  currency: 'NGN';
  estimatedMinutes: number;
}

export interface RecipientLookup {
  recipientType: RecipientType;
  recipientId?: string;
  name?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  phone: string;
}

export interface CreatePackageResult {
  package: PackageRecord;
  order: Order;
  pricing: PackagePriceBreakdown;
}

export interface PackageView {
  package: PackageRecord;
  order: Order | null;
  senderName: string | null;
}
