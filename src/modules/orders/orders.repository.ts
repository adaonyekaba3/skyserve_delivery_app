import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { orders } from '../../../drizzle/schema';
import { BaseRepository } from 'src/shared/database/base.repository';

@Injectable()
export class OrdersRepository extends BaseRepository {
  findRecent(limit = 50) {
    return this.db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  }

  findById(id: string) {
    return this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
  }
}
