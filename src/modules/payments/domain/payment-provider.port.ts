export type PaymentProviderName = 'PAYSTACK' | 'FLUTTERWAVE';

export interface InitializePaymentInput {
  orderId: string;
  amount: string;
  currency: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializePaymentResult {
  providerRef: string;
  authorizationUrl: string;
}

export interface VerifyPaymentResult {
  providerRef: string;
  status: 'AUTHORIZED' | 'CAPTURED' | 'FAILED';
  raw: Record<string, unknown>;
}

export interface PaymentProviderPort {
  readonly name: PaymentProviderName;
  initialize(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verify(providerRef: string): Promise<VerifyPaymentResult>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}
