import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentProviderPort,
  VerifyPaymentResult,
} from '../../domain/payment-provider.port';

const FLW_BASE = 'https://api.flutterwave.com/v3';

@Injectable()
export class FlutterwaveProvider implements PaymentProviderPort {
  readonly name = 'FLUTTERWAVE' as const;
  private readonly logger = new Logger(FlutterwaveProvider.name);

  async initialize(
    input: InitializePaymentInput,
  ): Promise<InitializePaymentResult> {
    const secretKey = process.env.FLW_SECRET_KEY;
    const txRef = `flw_${input.orderId}_${Date.now()}`;

    if (!secretKey) {
      this.logger.warn(
        'FLW_SECRET_KEY missing - returning sandbox authorization URL',
      );
      return {
        providerRef: txRef,
        authorizationUrl: `${input.callbackUrl}?provider=flutterwave&tx_ref=${txRef}`,
      };
    }

    const body = {
      tx_ref: txRef,
      amount: input.amount,
      currency: input.currency || 'NGN',
      redirect_url: input.callbackUrl,
      customer: {
        email: input.customerEmail ?? 'guest@skyrunner.local',
        name: input.customerName ?? 'Queen Member',
        phonenumber: input.customerPhone ?? undefined,
      },
      customizations: {
        title: 'Queen by Atelier Élevé',
        description: `Order ${input.orderId}`,
        logo: process.env.FLW_LOGO_URL ?? undefined,
      },
      payment_options: 'card,banktransfer,ussd',
      meta: {
        orderId: input.orderId,
        ...(input.metadata ?? {}),
      },
    };

    try {
      const res = await fetch(`${FLW_BASE}/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        status?: string;
        message?: string;
        data?: { link?: string };
      };
      if (!res.ok || json.status !== 'success' || !json.data?.link) {
        throw new Error(
          `Flutterwave initialize failed: ${json.message ?? res.status}`,
        );
      }
      return {
        providerRef: txRef,
        authorizationUrl: json.data.link,
      };
    } catch (err) {
      this.logger.error(
        `Flutterwave initialize error: ${(err as Error).message}`,
      );
      return {
        providerRef: txRef,
        authorizationUrl: `${input.callbackUrl}?provider=flutterwave&tx_ref=${txRef}&error=init_failed`,
      };
    }
  }

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    const secretKey = process.env.FLW_SECRET_KEY;
    if (!secretKey) {
      this.logger.warn('FLW_SECRET_KEY missing - verify returning AUTHORIZED');
      return {
        providerRef,
        status: 'AUTHORIZED',
        raw: { provider: this.name, providerRef, mode: 'sandbox' },
      };
    }

    try {
      const url = `${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(providerRef)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });
      const json = (await res.json()) as {
        status?: string;
        data?: {
          status?: string;
          amount?: number | string;
        };
      };
      const flwStatus = json?.data?.status?.toLowerCase();
      const amount = json?.data?.amount;
      let normalized: VerifyPaymentResult['status'] = 'PENDING';
      if (flwStatus === 'successful' || flwStatus === 'completed') {
        normalized = 'CAPTURED';
      } else if (flwStatus === 'failed' || flwStatus === 'cancelled') {
        normalized = 'FAILED';
      } else if (flwStatus === 'pending') {
        normalized = 'PENDING';
      } else if (flwStatus) {
        normalized = 'AUTHORIZED';
      }
      return {
        providerRef,
        status: normalized,
        amount: amount != null ? String(amount) : undefined,
        raw: json as Record<string, unknown>,
      };
    } catch (err) {
      this.logger.error(
        `Flutterwave verify error: ${(err as Error).message}`,
      );
      return {
        providerRef,
        status: 'PENDING',
        raw: { error: (err as Error).message },
      };
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secretHash = process.env.FLW_SECRET_HASH;
    if (!secretHash) {
      return Boolean(payload) && Boolean(signature);
    }
    if (!signature) return false;
    if (signature === secretHash) return true;
    try {
      const computed = createHmac('sha256', secretHash)
        .update(payload)
        .digest('hex');
      const a = Buffer.from(computed);
      const b = Buffer.from(signature);
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}
