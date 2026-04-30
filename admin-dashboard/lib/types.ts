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
  restaurantId: string | null;
  orderType?: 'food' | 'package_delivery';
  deliveryPriority?: 'standard' | 'priority';
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

export type LagosZone =
  | 'Ikoyi'
  | 'Victoria Island'
  | 'Lekki Phase 1'
  | 'Lekki Phase 2'
  | 'Banana Island'
  | 'Eko Atlantic';

export const LAGOS_ZONES: LagosZone[] = [
  'Ikoyi',
  'Victoria Island',
  'Lekki Phase 1',
  'Lekki Phase 2',
  'Banana Island',
  'Eko Atlantic',
];

export const RESTAURANT_CATEGORIES = [
  'Nigerian',
  'Healthy',
  'Drinks',
  'Continental',
  'Asian',
  'Pastry',
  'Grill',
  'Vegan',
] as const;
export type RestaurantCategory = (typeof RESTAURANT_CATEGORIES)[number];

export interface Vendor {
  id: string;
  ownerId: string | null;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  category: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorPerformance {
  ordersAllTime: number;
  ordersLast7d: number;
  ordersLast30d: number;
  avgTicketNgn: number;
  avgFulfillmentMinutes: number;
  activeMenuItems: number;
}

export interface CreateVendorPayload {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  category?: string;
  location?: string;
  isActive?: boolean;
}

export interface AdminOverview {
  ordersToday: number;
  ordersWeek: number;
  ordersMonth: number;
  activeDeliveries: number;
  avgDeliveryMinutes: number;
  motorcycleTripsAvoided: number;
  activeUsersByZone: Record<LagosZone, number>;
  unprocessedCount: number;
}

export interface AdminInsights {
  motorcycleTripsAvoided: number;
  estimatedTrafficReductionPct: number;
  carbonKgSaved: number;
  droneAdoptionRatePct: number;
  ordersByDay: Array<{ date: string; count: number }>;
}

export interface CartLine {
  id: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: string;
  restaurantId: string;
}

export interface Cart {
  id: string;
  userId: string;
  restaurantId: string | null;
  items: CartLine[];
  totalAmount: string;
}

export type OrderType = 'food' | 'package_delivery';
export type DeliveryPriority = 'standard' | 'priority';
export type PackageRecipientType = 'user' | 'vendor' | 'guest';
export type PackageCategory =
  | 'documents'
  | 'food'
  | 'parcel'
  | 'gift'
  | 'other';
export type PackageWeightClass = 'light' | 'medium' | 'heavy';

export interface Package {
  id: string;
  orderId: string;
  senderId: string;
  recipientPhone: string;
  recipientId: string | null;
  recipientType: PackageRecipientType;
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

export type BankTransferStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface BankTransfer {
  id: string;
  paymentId: string;
  orderId: string;
  proofUrl: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  status: BankTransferStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}
