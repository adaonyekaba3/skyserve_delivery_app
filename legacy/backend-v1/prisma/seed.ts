import {
  PrismaClient,
  RestaurantStatus,
  UserRole,
  DroneStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@skyserve.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin12345!';
  const operationsEmail =
    process.env.SEED_OPERATIONS_EMAIL ?? 'ops@skyserve.local';
  const operationsPassword =
    process.env.SEED_OPERATIONS_PASSWORD ?? 'Ops12345!';

  const [adminPasswordHash, operationsPasswordHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(operationsPassword, 10),
  ]);

  await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: {
      fullName: 'SkyServe Admin',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    create: {
      email: adminEmail.toLowerCase(),
      fullName: 'SkyServe Admin',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: operationsEmail.toLowerCase() },
    update: {
      fullName: 'SkyServe Operations',
      passwordHash: operationsPasswordHash,
      role: UserRole.OPERATIONS,
    },
    create: {
      email: operationsEmail.toLowerCase(),
      fullName: 'SkyServe Operations',
      passwordHash: operationsPasswordHash,
      role: UserRole.OPERATIONS,
    },
  });

  await prisma.restaurant.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {
      name: 'SkyBites Lagos',
      description: 'Seed restaurant for MVP verification',
      address: '12 Admiralty Way, Lekki Phase 1, Lagos',
      latitude: 6.4474,
      longitude: 3.4722,
      status: RestaurantStatus.ACTIVE,
    },
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'SkyBites Lagos',
      description: 'Seed restaurant for MVP verification',
      address: '12 Admiralty Way, Lekki Phase 1, Lagos',
      latitude: 6.4474,
      longitude: 3.4722,
      status: RestaurantStatus.ACTIVE,
    },
  });

  await prisma.drone.upsert({
    where: { serialNumber: 'SKY-DRONE-001' },
    update: {
      name: 'Skyrunner 01',
      batteryLevel: 100,
      latitude: 6.4474,
      longitude: 3.4722,
      status: DroneStatus.IDLE,
    },
    create: {
      serialNumber: 'SKY-DRONE-001',
      name: 'Skyrunner 01',
      batteryLevel: 100,
      latitude: 6.4474,
      longitude: 3.4722,
      status: DroneStatus.IDLE,
    },
  });

  console.log('Seed completed successfully.');
  console.log(`Admin user: ${adminEmail}`);
  console.log(`Operations user: ${operationsEmail}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
