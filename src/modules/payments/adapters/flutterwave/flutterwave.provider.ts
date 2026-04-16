import { Injectable } from '@nestjs/common';
import {
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentProviderPort,
  VerifyPaymentResult,
} from '../../domain/payment-provider.port';

@Injectable()
export class FlutterwaveProvider implements PaymentProviderPort {
  readonly name = 'FLUTTERWAVE' as const;

  async initialize(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    return {
      providerRef: `flw_${input.orderId}`,
      authorizationUrl: `${input.callbackUrl}?provider=flutterwave`,
    };
  }

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    return {
      providerRef,
      status: 'AUTHORIZED',
      raw: { provider: this.name, providerRef },
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    return Boolean(payload) && Boolean(signature);
  }
}
