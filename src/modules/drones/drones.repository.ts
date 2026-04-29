import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { drones } from '../../../drizzle/schema';
import { BaseRepository } from 'src/shared/database/base.repository';

@Injectable()
export class DronesRepository extends BaseRepository {
  list() {
    return this.db.select().from(drones).orderBy(asc(drones.code));
  }

  findByCode(code: string) {
    return this.db.select().from(drones).where(eq(drones.code, code)).limit(1);
  }

  updateTelemetry(
    code: string,
    fields: Partial<{
      batteryPct: number;
      currentLatitude: string;
      currentLongitude: string;
      status: 'IDLE' | 'DELIVERING' | 'CHARGING' | 'MAINTENANCE';
      activeDeliveryId: string | null;
    }>,
  ) {
    return this.db
      .update(drones)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(drones.code, code))
      .returning();
  }
}
