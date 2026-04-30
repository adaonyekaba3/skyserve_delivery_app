import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  bankTransfers,
  payments,
} from '../../../../drizzle/schema';
import { DrizzleService } from 'src/shared/database/drizzle.service';
import { OutboxService } from 'src/shared/events/outbox.service';
import { PusherService } from 'src/shared/realtime/pusher.service';
import {
  BankTransferInstructions,
  PaymentProviderName,
  PaymentProviderPort,
} from '../domain/payment-provider.port';
import { PaystackProvider } from '../adapters/paystack/paystack.provider';
import { FlutterwaveProvider } from '../adapters/flutterwave/flutterwave.provider';
import { StripeProvider } from '../adapters/stripe/stripe.provider';
import { BankTransferProvider } from '../adapters/bank-transfer/bank-transfer.provider';
import { OrdersService } from 'src/modules/orders/application/orders.service';

@Injectable()
export class PaymentsService {
  private readonly providerMap: Record<
    PaymentProviderName,
    PaymentProviderPort
  >;

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly outboxService: OutboxService,
    private readonly pusherService: PusherService,
    private readonly ordersService: OrdersService,
    stripeProvider: StripeProvider,
    paystackProvider: PaystackProvider,
    flutterwaveProvider: FlutterwaveProvider,
    private readonly bankTransferProvider: BankTransferProvider,
  ) {
    this.providerMap = {
      STRIPE: stripeProvider,
      PAYSTACK: paystackProvider,
      FLUTTERWAVE: flutterwaveProvider,
      BANK_TRANSFER: bankTransferProvider,
    };
  }

  async initializePayment(input: {
    orderId: string;
    amount: string;
    currency: string;
    callbackUrl: string;
    provider: PaymentProviderName;
    idempotencyKey: string;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
  }) {
    const existing = await this.drizzleService.db
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, input.idempotencyKey))
      .limit(1);

    if (existing.length) {
      const existingRow = existing[0];
      let instructions: BankTransferInstructions | undefined;
      if (existingRow.provider === 'BANK_TRANSFER') {
        const meta = existingRow.metadata as
          | { instructions?: BankTransferInstructions }
          | undefined;
        instructions = meta?.instructions;
      }
      return { ...existingRow, authorizationUrl: '', instructions };
    }

    const provider = this.providerMap[input.provider];
    if (!provider) {
      throw new BadRequestException('Unsupported payment provider');
    }

    const initialized = await provider.initialize(input);

    const isBankTransfer = input.provider === 'BANK_TRANSFER';
    const initialStatus = isBankTransfer ? 'PENDING' : 'AUTHORIZED';

    const [created] = await this.drizzleService.db
      .insert(payments)
      .values({
        orderId: input.orderId,
        provider: input.provider,
        providerRef: initialized.providerRef,
        amount: input.amount,
        currency: input.currency,
        idempotencyKey: input.idempotencyKey,
        status: initialStatus,
        metadata: initialized.instructions
          ? { instructions: initialized.instructions }
          : undefined,
      })
      .returning();

    if (isBankTransfer) {
      await this.drizzleService.db.insert(bankTransfers).values({
        paymentId: created.id,
        orderId: created.orderId,
        status: 'PENDING_REVIEW',
      });
    }

    await this.outboxService.enqueue('payment.initialized', {
      paymentId: created.id,
      orderId: created.orderId,
      provider: input.provider,
    });

    return {
      ...created,
      authorizationUrl: initialized.authorizationUrl,
      instructions: initialized.instructions,
    };
  }

  async getPaymentStatus(reference: string) {
    const [row] = await this.drizzleService.db
      .select()
      .from(payments)
      .where(eq(payments.providerRef, reference))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Payment not found');
    }

    if (
      row.provider === 'FLUTTERWAVE' &&
      (row.status === 'PENDING' || row.status === 'AUTHORIZED')
    ) {
      const provider = this.providerMap[row.provider as PaymentProviderName];
      const verified = await provider.verify(reference);
      if (verified.status !== row.status) {
        await this.drizzleService.db
          .update(payments)
          .set({ status: verified.status, updatedAt: new Date() })
          .where(eq(payments.id, row.id));
        if (
          verified.status === 'CAPTURED' ||
          verified.status === 'AUTHORIZED'
        ) {
          try {
            await this.ordersService.updateStatus(row.orderId, 'ACCEPTED');
          } catch {
            // Order likely already advanced; safe to ignore.
          }
        }
        return { ...row, status: verified.status };
      }
    }
    return row;
  }

  async submitBankTransferProof(input: {
    userId: string;
    paymentId: string;
    proofUrl: string;
  }) {
    const [paymentRow] = await this.drizzleService.db
      .select()
      .from(payments)
      .where(eq(payments.id, input.paymentId))
      .limit(1);
    if (!paymentRow) {
      throw new NotFoundException('Payment not found');
    }
    if (paymentRow.provider !== 'BANK_TRANSFER') {
      throw new BadRequestException('Payment is not a bank transfer');
    }

    const [updated] = await this.drizzleService.db
      .update(bankTransfers)
      .set({
        proofUrl: input.proofUrl,
        submittedAt: new Date(),
        status: 'PENDING_REVIEW',
        updatedAt: new Date(),
      })
      .where(eq(bankTransfers.paymentId, input.paymentId))
      .returning();

    await this.pusherService.trigger('private-admin', 'bank_transfer_changed', {
      type: 'submitted',
      bankTransfer: updated,
    });
    await this.outboxService.enqueue('bank_transfer.submitted', {
      bankTransferId: updated.id,
      paymentId: input.paymentId,
      orderId: updated.orderId,
      userId: input.userId,
    });

    return updated;
  }

  async handleWebhook(input: {
    provider: PaymentProviderName;
    signature: string;
    payloadRaw: string;
    providerRef: string;
  }) {
    const provider = this.providerMap[input.provider];
    if (!provider) {
      throw new BadRequestException('Unsupported payment provider');
    }
    if (!provider.verifyWebhookSignature(input.payloadRaw, input.signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const verified = await provider.verify(input.providerRef);

    const [updated] = await this.drizzleService.db
      .update(payments)
      .set({ status: verified.status, updatedAt: new Date() })
      .where(eq(payments.providerRef, input.providerRef))
      .returning();

    if (
      updated &&
      (verified.status === 'AUTHORIZED' || verified.status === 'CAPTURED')
    ) {
      try {
        await this.ordersService.updateStatus(updated.orderId, 'ACCEPTED');
      } catch {
        // Order may already be advanced by an operator; ignore transition conflicts.
      }
    }

    await this.outboxService.enqueue('payment.status.changed', {
      provider: input.provider,
      providerRef: input.providerRef,
      status: verified.status,
    });

    return updated;
  }
}
