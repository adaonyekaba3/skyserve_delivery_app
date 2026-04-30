import { Injectable } from '@nestjs/common';
import { and, eq, gte, sql } from 'drizzle-orm';
import { drones, orders, restaurants, users } from '../../../drizzle/schema';
import { BaseRepository } from 'src/shared/database/base.repository';

const LAGOS_ZONES = [
  'Ikoyi',
  'Victoria Island',
  'Lekki Phase 1',
  'Lekki Phase 2',
  'Banana Island',
  'Eko Atlantic',
] as const;
export type LagosZone = (typeof LAGOS_ZONES)[number];

const ZONE_PATTERNS: Record<LagosZone, string> = {
  Ikoyi: '%ikoyi%',
  'Victoria Island': '%victoria island%',
  'Lekki Phase 1': '%lekki phase 1%',
  'Lekki Phase 2': '%lekki phase 2%',
  'Banana Island': '%banana%',
  'Eko Atlantic': '%eko atlantic%',
};

@Injectable()
export class AdminRepository extends BaseRepository {
  async overview() {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [day] = await this.db
      .select({ c: sql<number>`count(*)::int` })
      .from(orders)
      .where(gte(orders.createdAt, startOfDay));

    const [week] = await this.db
      .select({ c: sql<number>`count(*)::int` })
      .from(orders)
      .where(gte(orders.createdAt, startOfWeek));

    const [month] = await this.db
      .select({ c: sql<number>`count(*)::int` })
      .from(orders)
      .where(gte(orders.createdAt, startOfMonth));

    const [active] = await this.db
      .select({ c: sql<number>`count(*)::int` })
      .from(drones)
      .where(eq(drones.status, 'DELIVERING'));

    const [avgRow] = await this.db
      .select({
        m: sql<number>`coalesce(avg(extract(epoch from (${orders.updatedAt} - ${orders.createdAt})) / 60.0), 0)::float`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, 'DELIVERED'),
          gte(orders.updatedAt, thirtyDaysAgo),
        ),
      );

    const [delivered] = await this.db
      .select({ c: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, 'DELIVERED'));

    const [unprocessed] = await this.db
      .select({ c: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.status, 'PENDING'),
          sql`${orders.createdAt} < ${fiveMinAgo}`,
        ),
      );

    const zoneCounts: Record<LagosZone, number> = {
      Ikoyi: 0,
      'Victoria Island': 0,
      'Lekki Phase 1': 0,
      'Lekki Phase 2': 0,
      'Banana Island': 0,
      'Eko Atlantic': 0,
    };
    for (const zone of LAGOS_ZONES) {
      const [row] = await this.db
        .select({ c: sql<number>`count(distinct ${orders.customerId})::int` })
        .from(orders)
        .where(
          sql`lower(${orders.deliveryAddress}) like ${ZONE_PATTERNS[zone]}`,
        );
      zoneCounts[zone] = Number(row?.c ?? 0);
    }

    return {
      ordersToday: Number(day?.c ?? 0),
      ordersWeek: Number(week?.c ?? 0),
      ordersMonth: Number(month?.c ?? 0),
      activeDeliveries: Number(active?.c ?? 0),
      avgDeliveryMinutes: Number(avgRow?.m ?? 0),
      motorcycleTripsAvoided: Number(delivered?.c ?? 0),
      activeUsersByZone: zoneCounts,
      unprocessedCount: Number(unprocessed?.c ?? 0),
    };
  }

  async insights() {
    const [delivered] = await this.db
      .select({ c: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, 'DELIVERED'));

    const [adoption] = await this.db
      .select({
        deliveredCustomers: sql<number>`count(distinct case when ${orders.status} = 'DELIVERED' then ${orders.customerId} end)::int`,
      })
      .from(orders);

    const [signedUpRow] = await this.db
      .select({ c: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, 'CUSTOMER'));

    const motorcycleTripsAvoided = Number(delivered?.c ?? 0);
    const baseline = 5000;
    const trafficReduction =
      motorcycleTripsAvoided > 0
        ? (motorcycleTripsAvoided / (motorcycleTripsAvoided + baseline)) * 100
        : 0;
    const carbonKgSaved = motorcycleTripsAvoided * 0.95;
    const adoptedCount = Number(adoption?.deliveredCustomers ?? 0);
    const signedUp = Math.max(1, Number(signedUpRow?.c ?? 1));
    const droneAdoptionRatePct = (adoptedCount / signedUp) * 100;

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const ordersByDayRows = await this.db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(gte(orders.createdAt, fourteenDaysAgo))
      .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
      .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

    return {
      motorcycleTripsAvoided,
      estimatedTrafficReductionPct: Number(trafficReduction.toFixed(2)),
      carbonKgSaved: Number(carbonKgSaved.toFixed(1)),
      droneAdoptionRatePct: Number(droneAdoptionRatePct.toFixed(2)),
      ordersByDay: ordersByDayRows.map((r) => ({
        date: r.date,
        count: Number(r.count ?? 0),
      })),
    };
  }

  vendorCount() {
    return this.db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${restaurants.isActive} = true)::int`,
      })
      .from(restaurants);
  }
}

export { LAGOS_ZONES };
