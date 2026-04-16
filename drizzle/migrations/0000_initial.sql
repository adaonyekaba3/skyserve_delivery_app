CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE role AS ENUM ('ADMIN', 'CUSTOMER', 'RESTAURANT_OWNER', 'OPERATIONS', 'SUPPORT');
CREATE TYPE order_status AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'PICKED_UP', 'IN_FLIGHT', 'DELIVERED', 'CANCELLED');
CREATE TYPE delivery_status AS ENUM ('ASSIGNED', 'PICKED_UP', 'IN_FLIGHT', 'DELIVERED', 'FAILED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role role NOT NULL DEFAULT 'CUSTOMER',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id),
  name text NOT NULL,
  address text NOT NULL,
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  status order_status NOT NULL DEFAULT 'PENDING',
  total_amount numeric(10,2) NOT NULL,
  delivery_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
  drone_code text NOT NULL,
  status delivery_status NOT NULL DEFAULT 'ASSIGNED',
  eta_minutes integer,
  current_latitude numeric(10,7),
  current_longitude numeric(10,7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  provider text NOT NULL,
  provider_ref text,
  idempotency_key text NOT NULL UNIQUE,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  status payment_status NOT NULL DEFAULT 'PENDING',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  from_status text,
  to_status text NOT NULL,
  actor_user_id uuid REFERENCES users(id),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX restaurants_owner_id_idx ON restaurants(owner_id);
CREATE INDEX orders_customer_id_idx ON orders(customer_id);
CREATE INDEX orders_restaurant_id_idx ON orders(restaurant_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX deliveries_status_idx ON deliveries(status);
CREATE INDEX payments_order_id_idx ON payments(order_id);
CREATE INDEX status_events_entity_idx ON status_events(entity_type, entity_id);
