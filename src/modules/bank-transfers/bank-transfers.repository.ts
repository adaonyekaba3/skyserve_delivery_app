import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { BaseRepository } from 'src/shared/database/base.repository';
import { bankTransfers } from '../../../drizzle/schema';

@Injectable()
export class BankTransfersRepository extends BaseRepository {
  list(status?: string, limit = 100) {
    if (status) {
      return this.db
        .select()
        .from(bankTransfers)
        .where(eq(bankTransfers.status, status))
        .orderBy(desc(bankTransfers.createdAt))
        .limit(limit);
    }
    return this.db
      .select()
      .from(bankTransfers)
      .orderBy(desc(bankTransfers.createdAt))
      .limit(limit);
  }

  findById(id: string) {
    return this.db
      .select()
      .from(bankTransfers)
      .where(eq(bankTransfers.id, id))
      .limit(1);
  }

  updateStatus(input: {
    id: string;
    status: 'APPROVED' | 'REJECTED';
    verifiedBy: string;
    notes?: string | null;
  }) {
    return this.db
      .update(bankTransfers)
      .set({
        status: input.status,
        verifiedBy: input.verifiedBy,
        verifiedAt: new Date(),
        adminNotes: input.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(bankTransfers.id, input.id))
      .returning();
  }
}
