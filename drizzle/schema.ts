import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', [
  'ADMIN',
  'CUSTOMER',
  'RESTAURANT_OWNER',
  'OPERATIONS',
  'SUPPORT',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'PICKED_UP',
  'IN_FLIGHT',
  'DELIVERED',
  'CANCELLED',
]);

export const deliveryStatusEnum = pgEnum('delivery_status', [
  'ASSIGNED',
  'PICKED_UP',
  'IN_FLIGHT',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'REFUNDED',
]);

export const droneStatusEnum = pgEnum('drone_status', [
  'IDLE',
  'DELIVERING',
  'CHARGING',
  'MAINTENANCE',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkUserId: text('clerk_user_id').notNull(),
    email: text('email').notNull(),
    fullName: text('full_name').notNull(),
    role: roleEnum('role').notNull().default('CUSTOMER'),
    location: text('location'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    clerkUserIdx: uniqueIndex('users_clerk_user_id_uidx').on(t.clerkUserId),
    emailIdx: uniqueIndex('users_email_uidx').on(t.email),
  }),
);

export const restaurants = pgTable(
  'restaurants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').references(() => users.id),
    name: text('name').notNull(),
    address: text('address').notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
    category: text('category'),
    location: text('location'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    ownerIdx: index('restaurants_owner_id_idx').on(t.ownerId),
    activeIdx: index('restaurants_is_active_idx').on(t.isActive),
  }),
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id),
    status: orderStatusEnum('status').notNull().default('PENDING'),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    deliveryAddress: text('delivery_address').notNull(),
    deliveryLatitude: decimal('delivery_latitude', { precision: 10, scale: 7 }),
    deliveryLongitude: decimal('delivery_longitude', {
      precision: 10,
      scale: 7,
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    customerIdx: index('orders_customer_id_idx').on(t.customerId),
    restaurantIdx: index('orders_restaurant_id_idx').on(t.restaurantId),
    statusIdx: index('orders_status_idx').on(t.status),
  }),
);

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id),
    name: text('name').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    isAvailable: boolean('is_available').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    restaurantIdx: index('menu_items_restaurant_id_idx').on(t.restaurantId),
  }),
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    nameSnapshot: text('name_snapshot').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    orderIdx: index('order_items_order_id_idx').on(t.orderId),
  }),
);

export const drones = pgTable(
  'drones',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull(),
    status: droneStatusEnum('status').notNull().default('IDLE'),
    batteryPct: integer('battery_pct').notNull().default(100),
    currentLatitude: decimal('current_latitude', { precision: 10, scale: 7 }),
    currentLongitude: decimal('current_longitude', { precision: 10, scale: 7 }),
    activeDeliveryId: uuid('active_delivery_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    codeIdx: uniqueIndex('drones_code_uidx').on(t.code),
    statusIdx: index('drones_status_idx').on(t.status),
  }),
);

export const deliveries = pgTable(
  'deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    droneCode: text('drone_code').notNull(),
    status: deliveryStatusEnum('status').notNull().default('ASSIGNED'),
    etaMinutes: integer('eta_minutes'),
    currentLatitude: decimal('current_latitude', { precision: 10, scale: 7 }),
    currentLongitude: decimal('current_longitude', { precision: 10, scale: 7 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    orderIdx: uniqueIndex('deliveries_order_id_uidx').on(t.orderId),
    statusIdx: index('deliveries_status_idx').on(t.status),
  }),
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    provider: text('provider').notNull(),
    providerRef: text('provider_ref'),
    idempotencyKey: text('idempotency_key').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('NGN'),
    status: paymentStatusEnum('status').notNull().default('PENDING'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    orderIdx: index('payments_order_id_idx').on(t.orderId),
    idemIdx: uniqueIndex('payments_idempotency_key_uidx').on(t.idempotencyKey),
  }),
);

export const statusEvents = pgTable(
  'status_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    fromStatus: text('from_status'),
    toStatus: text('to_status').notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    entityIdx: index('status_events_entity_idx').on(t.entityType, t.entityId),
  }),
);

export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    restaurantId: uuid('restaurant_id').references(() => restaurants.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: uniqueIndex('carts_user_id_uidx').on(t.userId),
  }),
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    addedAt: timestamp('added_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    cartIdx: index('cart_items_cart_id_idx').on(t.cartId),
    cartMenuUidx: uniqueIndex('cart_items_cart_menu_uidx').on(
      t.cartId,
      t.menuItemId,
    ),
  }),
);
