#!/usr/bin/env node
/* eslint-disable no-console */
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
const TOKEN = process.env.OPERATOR_DEV_TOKEN ?? 'dev-token';
const INTERVAL_MS = Number(process.env.DRONE_SIM_INTERVAL_MS ?? 2000);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function stepToward(current, target, step = 0.0012) {
  if (current === null || Number.isNaN(current)) return target;
  const delta = target - current;
  if (Math.abs(delta) <= step) return target;
  return current + Math.sign(delta) * step;
}

async function fetchActiveDeliveries(client) {
  const result = await client.query(`
    SELECT d.id AS delivery_id, d.drone_code, d.current_latitude, d.current_longitude,
           o.delivery_latitude, o.delivery_longitude
    FROM deliveries d
    JOIN orders o ON o.id = d.order_id
    WHERE d.status IN ('ASSIGNED', 'PICKED_UP', 'IN_FLIGHT')
  `);
  return result.rows;
}

async function patchDrone(code, payload) {
  const res = await fetch(`${API_BASE_URL}/drones/${code}/telemetry`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${code} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function tick() {
  const client = await pool.connect();
  try {
    const active = await fetchActiveDeliveries(client);
    if (!active.length) {
      console.log('[sim] no active deliveries; idling');
      return;
    }
    for (const row of active) {
      const targetLat = Number(row.delivery_latitude ?? rand(6.42, 6.62));
      const targetLng = Number(row.delivery_longitude ?? rand(3.30, 3.50));
      const currentLat = row.current_latitude ? Number(row.current_latitude) : rand(6.42, 6.62);
      const currentLng = row.current_longitude ? Number(row.current_longitude) : rand(3.30, 3.50);
      const nextLat = stepToward(currentLat, targetLat);
      const nextLng = stepToward(currentLng, targetLng);
      const delivered =
        Math.abs(targetLat - nextLat) < 0.0002 && Math.abs(targetLng - nextLng) < 0.0002;

      await patchDrone(row.drone_code, {
        status: delivered ? 'IDLE' : 'DELIVERING',
        batteryPct: Math.max(20, Math.floor(rand(35, 99))),
        latitude: nextLat.toFixed(7),
        longitude: nextLng.toFixed(7),
        activeDeliveryId: delivered ? null : row.delivery_id,
      });
      console.log(
        `[sim] ${row.drone_code} -> ${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}${delivered ? ' (arrived)' : ''}`,
      );
    }
  } finally {
    client.release();
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  console.log(`[sim] starting drone simulator every ${INTERVAL_MS}ms`);
  await tick();
  setInterval(() => {
    tick().catch((err) => console.error('[sim] tick failed', err.message));
  }, INTERVAL_MS);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
