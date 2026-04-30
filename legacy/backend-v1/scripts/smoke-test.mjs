const baseUrl = (
  process.env.API_BASE_URL ?? 'http://127.0.0.1:3000/api/v1'
).replace(/\/$/, '');
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@skyserve.local';
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin12345!';

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `${options.method ?? 'GET'} ${path} failed with ${response.status}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}

async function main() {
  const health = await request('/health');
  console.log('Health check passed:', health.status);

  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
    }),
  });

  const adminToken = login.accessToken;
  if (!adminToken) {
    throw new Error('Admin login did not return an access token');
  }

  const me = await request('/auth/me', {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  console.log('Authenticated as:', me.user.email);

  const restaurants = await request('/restaurants');
  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    throw new Error('No restaurants returned from public endpoint');
  }
  console.log('Restaurant list returned', restaurants.length, 'record(s)');

  const customerEmail = `customer.${Date.now()}@example.com`;
  const registration = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Smoke Test Customer',
      email: customerEmail,
      password: 'Customer123!',
    }),
  });

  const customerToken = registration.accessToken;
  const customerId = registration.user.id;
  console.log('Registered test customer:', customerId);

  const order = await request('/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      restaurantId: restaurants[0].id,
      totalAmount: 25.5,
      deliveryAddress: '14 Wole Olateju Crescent, Lekki Phase 1, Lagos',
      notes: 'Smoke test order',
    }),
  });
  console.log('Created order:', order.id);

  const drones = await request('/drones', {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  if (!Array.isArray(drones) || drones.length === 0) {
    throw new Error('No drones returned for admin');
  }
  console.log('Drone list returned', drones.length, 'record(s)');

  const delivery = await request('/deliveries', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      orderId: order.id,
      droneId: drones[0].id,
      etaMinutes: 18,
    }),
  });
  console.log('Created delivery:', delivery.id);

  const pickedUpDelivery = await request(`/deliveries/${delivery.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'PICKED_UP',
      etaMinutes: 14,
    }),
  });
  console.log('Updated delivery status:', pickedUpDelivery.status);

  const updatedDelivery = await request(`/deliveries/${delivery.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'IN_FLIGHT',
      currentLatitude: 6.4512,
      currentLongitude: 3.4821,
      etaMinutes: 9,
    }),
  });
  console.log('Updated delivery status:', updatedDelivery.status);

  const customerOrders = await request('/orders', {
    headers: {
      Authorization: `Bearer ${customerToken}`,
    },
  });
  if (!Array.isArray(customerOrders) || customerOrders.length === 0) {
    throw new Error('Customer order listing failed');
  }

  console.log('Smoke test completed successfully.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
