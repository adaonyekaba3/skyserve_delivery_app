#!/usr/bin/env node
/* eslint-disable no-console */
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

const SEED_USERS = [
  {
    clerkUserId: 'seed_admin',
    email: 'admin@skyserve.local',
    fullName: 'Skyserve Admin',
    role: 'ADMIN',
  },
  {
    clerkUserId: 'seed_owner',
    email: 'owner@skyserve.local',
    fullName: 'Restaurant Owner',
    role: 'RESTAURANT_OWNER',
  },
  {
    clerkUserId: 'seed_customer',
    email: 'customer@skyserve.local',
    fullName: 'Hungry Customer',
    role: 'CUSTOMER',
  },
  {
    clerkUserId: 'seed_dev',
    email: 'dev@skyrunner.local',
    fullName: 'Dev User',
    role: 'ADMIN',
  },
];

const SEED_RESTAURANTS = [
  {
    name: 'Skyline Burgers',
    address: '12 Marina Way, Lagos',
    latitude: '6.4501',
    longitude: '3.3947',
  },
  {
    name: 'Cloud Kitchen Pizza',
    address: '34 Allen Ave, Ikeja',
    latitude: '6.6018',
    longitude: '3.3515',
  },
  {
    name: 'Drone Sushi',
    address: '78 Admiralty Way, Lekki',
    latitude: '6.4283',
    longitude: '3.4583',
  },
];

const MENUS = {
  'Skyline Burgers': [
    {
      name: 'Cheeseburger',
      price: '4500.00',
      description: 'Beef patty + cheddar',
    },
    {
      name: 'Chicken Burger',
      price: '4200.00',
      description: 'Crispy chicken thigh',
    },
    {
      name: 'Sky Fries',
      price: '1500.00',
      description: 'Salted hand-cut fries',
    },
    { name: 'Iced Tea', price: '1200.00', description: 'Lemon iced tea' },
    {
      name: 'Veggie Wrap',
      price: '3800.00',
      description: 'Garden veggies + hummus',
    },
  ],
  'Cloud Kitchen Pizza': [
    {
      name: 'Margherita',
      price: '6500.00',
      description: 'Tomato, mozzarella, basil',
    },
    {
      name: 'Pepperoni',
      price: '7200.00',
      description: 'Beef pepperoni + cheese',
    },
    {
      name: 'BBQ Chicken',
      price: '7500.00',
      description: 'BBQ sauce + grilled chicken',
    },
    {
      name: 'Vegetarian',
      price: '6800.00',
      description: 'Peppers, mushrooms, onions',
    },
    { name: 'Coke 50cl', price: '900.00', description: 'Chilled' },
  ],
  'Drone Sushi': [
    {
      name: 'Salmon Nigiri (6)',
      price: '5500.00',
      description: 'Fresh salmon over rice',
    },
    {
      name: 'California Roll',
      price: '4800.00',
      description: 'Crab + avocado + cucumber',
    },
    {
      name: 'Spicy Tuna Roll',
      price: '5200.00',
      description: 'With sriracha mayo',
    },
    { name: 'Edamame', price: '1800.00', description: 'Steamed soybeans' },
    { name: 'Miso Soup', price: '1500.00', description: 'Tofu + seaweed' },
  ],
};

const DRONES = [
  { code: 'SKY-001', latitude: '6.4501', longitude: '3.3947' },
  { code: 'SKY-002', latitude: '6.6018', longitude: '3.3515' },
  { code: 'SKY-003', latitude: '6.4283', longitude: '3.4583' },
  { code: 'SKY-004', latitude: '6.5244', longitude: '3.3792' },
];

async function upsertUser(client, user) {
  const res = await client.query(
    `INSERT INTO users (clerk_user_id, email, full_name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role
     RETURNING id, email, role`,
    [user.clerkUserId, user.email, user.fullName, user.role],
  );
  return res.rows[0];
}

async function upsertRestaurant(client, ownerId, restaurant) {
  const existing = await client.query(
    `SELECT id FROM restaurants WHERE name = $1 AND owner_id = $2`,
    [restaurant.name, ownerId],
  );
  if (existing.rows[0]) {
    return existing.rows[0];
  }
  const res = await client.query(
    `INSERT INTO restaurants (owner_id, name, address, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      ownerId,
      restaurant.name,
      restaurant.address,
      restaurant.latitude,
      restaurant.longitude,
    ],
  );
  return res.rows[0];
}

async function upsertMenuItem(client, restaurantId, item) {
  const existing = await client.query(
    `SELECT id FROM menu_items WHERE restaurant_id = $1 AND name = $2`,
    [restaurantId, item.name],
  );
  if (existing.rows[0]) {
    return existing.rows[0];
  }
  const res = await client.query(
    `INSERT INTO menu_items (restaurant_id, name, description, price)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [restaurantId, item.name, item.description, item.price],
  );
  return res.rows[0];
}

async function upsertDrone(client, drone) {
  const existing = await client.query(`SELECT id FROM drones WHERE code = $1`, [
    drone.code,
  ]);
  if (existing.rows[0]) {
    return existing.rows[0];
  }
  const res = await client.query(
    `INSERT INTO drones (code, status, battery_pct, current_latitude, current_longitude)
     VALUES ($1, 'IDLE', 100, $2, $3)
     RETURNING id`,
    [drone.code, drone.latitude, drone.longitude],
  );
  return res.rows[0];
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('Seeding users...');
    const users = {};
    for (const u of SEED_USERS) {
      const row = await upsertUser(client, u);
      users[u.clerkUserId] = row;
      console.log(`  ${u.role} ${u.email} -> ${row.id}`);
    }

    const owner = users.seed_owner;
    console.log('Seeding restaurants...');
    const restaurantIds = {};
    for (const r of SEED_RESTAURANTS) {
      const row = await upsertRestaurant(client, owner.id, r);
      restaurantIds[r.name] = row.id;
      console.log(`  ${r.name} -> ${row.id}`);
    }

    console.log('Seeding menu items...');
    for (const r of SEED_RESTAURANTS) {
      const items = MENUS[r.name] ?? [];
      for (const item of items) {
        const row = await upsertMenuItem(client, restaurantIds[r.name], item);
        console.log(`  ${r.name} :: ${item.name} -> ${row.id}`);
      }
    }

    console.log('Seeding drones...');
    for (const d of DRONES) {
      const row = await upsertDrone(client, d);
      console.log(`  ${d.code} -> ${row.id}`);
    }

    console.log('Seed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
