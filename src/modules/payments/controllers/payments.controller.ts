import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { PaymentProviderName } from '../domain/payment-provider.port';
import { PaymentsService } from '../application/payments.service';
import { Public } from 'src/modules/identity/guards/public.decorator';

class InitializePaymentDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  amount!: string;

  @IsString()
  currency!: string;

  @IsString()
  callbackUrl!: string;

  @IsEnum({ PAYSTACK: 'PAYSTACK', FLUTTERWAVE: 'FLUTTERWAVE' })
  provider!: PaymentProviderName;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}

@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  initialize(@Body() dto: InitializePaymentDto) {
    return this.paymentsService.initializePayment(dto);
  }

  @Public()
  @Post('webhooks/:provider')
  webhook(
    @Param('provider') provider: PaymentProviderName,
    @Headers('x-signature') signature: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.paymentsService.handleWebhook({
      provider,
      signature,
      payloadRaw: JSON.stringify(body),
      providerRef: String(body.providerRef ?? ''),
    });
  }
}
