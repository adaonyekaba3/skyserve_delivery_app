import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { orders } from '../../../../drizzle/schema';
import { DrizzleService } from 'src/shared/database/drizzle.service';
import { LogisticsWorkflowService } from 'src/shared/workflows/logistics-workflow.service';
import { OrdersRepository } from '../orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly drizzleService: DrizzleService,
    private readonly logisticsWorkflowService: LogisticsWorkflowService,
  ) {}

  listRecent() {
    return this.ordersRepository.findRecent();
  }

  async create(input: {
    customerId: string;
    restaurantId: string;
    totalAmount: string;
    deliveryAddress: string;
  }) {
    const [created] = await this.drizzleService.db
      .insert(orders)
      .values({
        customerId: input.customerId,
        restaurantId: input.restaurantId,
        totalAmount: input.totalAmount,
        deliveryAddress: input.deliveryAddress,
      })
      .returning();

    return created;
  }

  updateStatus(orderId: string, nextStatus: Parameters<LogisticsWorkflowService['updateOrderStatus']>[0]['nextStatus']) {
    return this.logisticsWorkflowService.updateOrderStatus({ orderId, nextStatus });
  }

  async findById(orderId: string) {
    const rows = await this.drizzleService.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    return rows[0] ?? null;
  }
}
