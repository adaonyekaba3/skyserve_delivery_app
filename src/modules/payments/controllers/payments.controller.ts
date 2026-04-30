import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaymentProviderName } from '../domain/payment-provider.port';
import { PaymentsService } from '../application/payments.service';
import { Public } from 'src/modules/identity/guards/public.decorator';
import { Roles } from 'src/modules/identity/guards/roles.decorator';
import { Role } from 'src/shared/types/role.enum';
import { CurrentUser } from 'src/modules/identity/guards/current-user.decorator';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';

class InitializePaymentDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  amount!: string;

  @IsString()
  currency!: string;

  @IsString()
  callbackUrl!: string;

  @IsEnum({
    STRIPE: 'STRIPE',
    PAYSTACK: 'PAYSTACK',
    FLUTTERWAVE: 'FLUTTERWAVE',
    BANK_TRANSFER: 'BANK_TRANSFER',
  })
  provider!: PaymentProviderName;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;
}

class BankProofDto {
  @IsUUID()
  paymentId!: string;

  @IsString()
  proofUrl!: string;
}

@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  initialize(@Body() dto: InitializePaymentDto) {
    return this.paymentsService.initializePayment(dto);
  }

  @Get('status')
  getStatus(@Query('reference') reference: string) {
    return this.paymentsService.getPaymentStatus(reference);
  }

  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Post('bank-transfer/proof')
  submitProof(
    @Body() dto: BankProofDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.submitBankTransferProof({
      userId: user.dbUserId,
      paymentId: dto.paymentId,
      proofUrl: dto.proofUrl,
    });
  }

  @Public()
  @Post('webhooks/:provider')
  webhook(
    @Param('provider') provider: PaymentProviderName,
    @Headers('verif-hash') flwSignature: string,
    @Headers('x-signature') xSignature: string,
    @Body() body: Record<string, unknown>,
  ) {
    const signature = flwSignature || xSignature;
    let providerRef = String(body.providerRef ?? '');
    if (!providerRef && body.data && typeof body.data === 'object') {
      const data = body.data as Record<string, unknown>;
      providerRef = String(data.tx_ref ?? data.reference ?? '');
    }
    return this.paymentsService.handleWebhook({
      provider,
      signature,
      payloadRaw: JSON.stringify(body),
      providerRef,
    });
  }
}
