import { Injectable } from '@nestjs/common';
import {
  BankTransferInstructions,
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentProviderPort,
  VerifyPaymentResult,
} from '../../domain/payment-provider.port';

@Injectable()
export class BankTransferProvider implements PaymentProviderPort {
  readonly name = 'BANK_TRANSFER' as const;

  buildInstructions(input: InitializePaymentInput): BankTransferInstructions {
    const reference = `BT_${input.orderId}_${Date.now()}`;
    return {
      bankName: process.env.PROVIDUS_BANK_NAME ?? 'Providus Bank',
      accountName:
        process.env.PROVIDUS_ACCOUNT_NAME ?? 'Queen by Atelier Élevé',
      accountNumber:
        process.env.PROVIDUS_ACCOUNT_NUMBER ?? '0000000000',
      amount: input.amount,
      currency: input.currency || 'NGN',
      reference,
      note: 'Use the reference as the transfer narration.',
    };
  }

  async initialize(
    input: InitializePaymentInput,
  ): Promise<InitializePaymentResult> {
    const instructions = this.buildInstructions(input);
    return {
      providerRef: instructions.reference,
      authorizationUrl: '',
      instructions,
    };
  }

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    return {
      providerRef,
      status: 'PENDING',
      raw: { provider: this.name, providerRef, note: 'Manual verification' },
    };
  }

  verifyWebhookSignature(): boolean {
    return false;
  }
}
