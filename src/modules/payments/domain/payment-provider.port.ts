export type PaymentProviderName =
  | 'STRIPE'
  | 'PAYSTACK'
  | 'FLUTTERWAVE'
  | 'BANK_TRANSFER';

export interface InitializePaymentInput {
  orderId: string;
  amount: string;
  currency: string;
  callbackUrl: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface InitializePaymentResult {
  providerRef: string;
  authorizationUrl: string;
  instructions?: BankTransferInstructions;
}

export interface VerifyPaymentResult {
  providerRef: string;
  status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED';
  amount?: string;
  raw: Record<string, unknown>;
}

export interface BankTransferInstructions {
  bankName: string;
  accountName: string;
  accountNumber: string;
  amount: string;
  currency: string;
  reference: string;
  note: string;
}

export interface PaymentProviderPort {
  readonly name: PaymentProviderName;
  initialize(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verify(providerRef: string): Promise<VerifyPaymentResult>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}
