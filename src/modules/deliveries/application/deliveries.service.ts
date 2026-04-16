import { Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { deliveries } from '../../../../drizzle/schema';
import { DrizzleService } from 'src/shared/database/drizzle.service';
import { LogisticsWorkflowService } from 'src/shared/workflows/logistics-workflow.service';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly logisticsWorkflowService: LogisticsWorkflowService,
  ) {}

  listRecent(limit = 50) {
    return this.drizzleService.db
      .select()
      .from(deliveries)
      .orderBy(desc(deliveries.createdAt))
      .limit(limit);
  }

  updateStatus(
    deliveryId: string,
    nextStatus: 'ASSIGNED' | 'PICKED_UP' | 'IN_FLIGHT' | 'DELIVERED' | 'FAILED' | 'CANCELLED',
    location?: { latitude: string; longitude: string; etaMinutes?: number },
  ) {
    return this.logisticsWorkflowService.updateDeliveryStatus({
      deliveryId,
      nextStatus,
      location,
    });
  }
}
