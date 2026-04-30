#!/usr/bin/env node
/* eslint-disable no-console */
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const IMG =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80';

const VENDORS = [
  ['Orchids Bistro', 'Continental / Healthy', 'Ikoyi', '58A Isaac John St, Ikoyi, Lagos', '6.4519', '3.4301'],
  ['RSVP Lagos', 'Fine Dining', 'Victoria Island', '9 Eletu Ogabi St, Victoria Island, Lagos', '6.4313', '3.4335'],
  ['Circa Lagos', 'Contemporary Dining', 'Victoria Island', '2 Kafi St, Victoria Island, Lagos', '6.4288', '3.4320'],
  ['Noir Lagos', 'Pan-Asian', 'Victoria Island', '4A A.J. Marinho Dr, Victoria Island, Lagos', '6.4299', '3.4219'],
  ['Eric Kayser Lagos', 'Bakery / Café', 'Ikoyi', '1a Ozumba Mbadiwe Ave, Ikoyi, Lagos', '6.4368', '3.4312'],
  ['Mai Shayi Coffee Roasters Lagos', 'Specialty Coffee / Café', 'Victoria Island', '3 Idejo St, Victoria Island, Lagos', '6.4357', '3.4308'],
];

const MENU = {
  'Orchids Bistro': [['Grilled Salmon Bowl', '14500'], ['Chicken Avocado Salad', '11200'], ['Lemon Herb Pasta', '9800']],
  'RSVP Lagos': [['Truffle Jollof Arancini', '11800'], ['Seared Sea Bass', '18500'], ['Lobster Tagliatelle', '22500']],
  'Circa Lagos': [['Braised Short Rib', '16400'], ['Smoked Turkey Suya Bites', '9200'], ['Burrata Tomato Tartine', '10600']],
  'Noir Lagos': [['Spicy Tuna Maki', '13200'], ['Miso Black Cod', '19800'], ['Prawn Yakisoba', '14900']],
  'Eric Kayser Lagos': [['Almond Croissant', '6200'], ['Pain au Chocolat', '5900'], ['Turkey Club Sandwich', '9800']],
  'Mai Shayi Coffee Roasters Lagos': [['Cold Brew Coffee', '5400'], ['Signature Latte', '6100'], ['Butter Croissant', '4300']],
};

async function upsertUser(client, user) {
  const q = `INSERT INTO users (clerk_user_id,email,full_name,role,phone_number,default_address,default_latitude,default_longitude)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
  ON CONFLICT (clerk_user_id) DO UPDATE SET email=EXCLUDED.email,full_name=EXCLUDED.full_name,role=EXCLUDED.role,phone_number=EXCLUDED.phone_number,default_address=EXCLUDED.default_address,default_latitude=EXCLUDED.default_latitude,default_longitude=EXCLUDED.default_longitude
  RETURNING id`;
  return (await client.query(q, [user.clerkUserId, user.email, user.fullName, user.role, user.phone, user.address, user.lat, user.lng])).rows[0];
}

async function main() {
  const client = await pool.connect();
  try {
    const owner = await upsertUser(client, { clerkUserId: 'seed_owner', email: 'owner@skyrunner.local', fullName: 'Skyrunner Vendor Ops', role: 'RESTAURANT_OWNER', phone: '+2348090000001', address: '5A Kofo Abayomi St, Victoria Island', lat: '6.4309', lng: '3.4260' });
    await upsertUser(client, { clerkUserId: 'seed_admin', email: 'admin@skyrunner.local', fullName: 'Skyrunner Admin', role: 'ADMIN', phone: '+2348090000000', address: '22A Alfred Rewane Rd, Ikoyi', lat: '6.4502', lng: '3.4307' });
    await upsertUser(client, { clerkUserId: 'seed_customer', email: 'customer@skyrunner.local', fullName: 'Adaobi Okonkwo', role: 'CUSTOMER', phone: '+2348035551234', address: '12 Bourdillon Rd, Ikoyi, Lagos', lat: '6.4488', lng: '3.4300' });
    await upsertUser(client, { clerkUserId: 'seed_dev', email: 'dev@skyrunner.local', fullName: 'Dev User', role: 'ADMIN', phone: '+2348030000000', address: '23A Admiralty Way, Lekki', lat: '6.4381', lng: '3.4721' });

    for (const [name, category, location, address, lat, lng] of VENDORS) {
      const ins = await client.query(
        `INSERT INTO restaurants (owner_id,name,address,latitude,longitude,category,location,is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true)
         ON CONFLICT DO NOTHING RETURNING id`,
        [owner.id, name, address, lat, lng, category, location],
      );
      const rid = ins.rows[0]?.id ?? (await client.query(`SELECT id FROM restaurants WHERE name=$1 LIMIT 1`, [name])).rows[0].id;
      for (const [item, price] of MENU[name]) {
        await client.query(
          `INSERT INTO menu_items (restaurant_id,name,description,image_url,price,is_available)
           VALUES ($1,$2,$3,$4,$5,true)
           ON CONFLICT DO NOTHING`,
          [rid, item, `${category} favorite`, `${IMG}&sig=${encodeURIComponent(name + item)}`, price],
        );
      }
    }

    const drones = [
      ['SKY-IKY-01', '6.4510', '3.4280'],
      ['SKY-IKY-02', '6.4494', '3.4312'],
      ['SKY-VI-01', '6.4301', '3.4301'],
      ['SKY-VI-02', '6.4279', '3.4322'],
      ['SKY-LEK-01', '6.4450', '3.4790'],
      ['SKY-LEK-02', '6.4428', '3.4761'],
    ];
    for (const [code, lat, lng] of drones) {
      await client.query(
        `INSERT INTO drones (code,status,battery_pct,current_latitude,current_longitude)
         VALUES ($1,'IDLE',100,$2,$3)
         ON CONFLICT (code) DO UPDATE SET current_latitude=EXCLUDED.current_latitude,current_longitude=EXCLUDED.current_longitude`,
        [code, lat, lng],
      );
    }
    console.log('Luxury seed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
