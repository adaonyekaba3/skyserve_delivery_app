import { BadRequestException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { payments } from '../../../../drizzle/schema';
import { DrizzleService } from 'src/shared/database/drizzle.service';
import { OutboxService } from 'src/shared/events/outbox.service';
import {
  PaymentProviderName,
  PaymentProviderPort,
} from '../domain/payment-provider.port';
import { PaystackProvider } from '../adapters/paystack/paystack.provider';
import { FlutterwaveProvider } from '../adapters/flutterwave/flutterwave.provider';
import { StripeProvider } from '../adapters/stripe/stripe.provider';
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
    private readonly ordersService: OrdersService,
    stripeProvider: StripeProvider,
    paystackProvider: PaystackProvider,
    flutterwaveProvider: FlutterwaveProvider,
  ) {
    this.providerMap = {
      STRIPE: stripeProvider,
      PAYSTACK: paystackProvider,
      FLUTTERWAVE: flutterwaveProvider,
    };
  }

  async initializePayment(input: {
    orderId: string;
    amount: string;
    currency: string;
    callbackUrl: string;
    provider: PaymentProviderName;
    idempotencyKey: string;
  }) {
    const existing = await this.drizzleService.db
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, input.idempotencyKey))
      .limit(1);

    if (existing.length) {
      return existing[0];
    }

    const provider = this.providerMap[input.provider];
    if (!provider) {
      throw new BadRequestException('Unsupported payment provider');
    }

    const initialized = await provider.initialize(input);

    const [created] = await this.drizzleService.db
      .insert(payments)
      .values({
        orderId: input.orderId,
        provider: input.provider,
        providerRef: initialized.providerRef,
        amount: input.amount,
        currency: input.currency,
        idempotencyKey: input.idempotencyKey,
        status: 'AUTHORIZED',
      })
      .returning();

    await this.outboxService.enqueue('payment.initialized', {
      paymentId: created.id,
      orderId: created.orderId,
    });

    return {
      ...created,
      authorizationUrl: initialized.authorizationUrl,
    };
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
      .set({ status: verified.status })
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
