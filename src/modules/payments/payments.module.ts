import { Module } from '@nestjs/common';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './application/payments.service';
import { PaystackProvider } from './adapters/paystack/paystack.provider';
import { FlutterwaveProvider } from './adapters/flutterwave/flutterwave.provider';
import { BankTransferProvider } from './adapters/bank-transfer/bank-transfer.provider';
import { StripeProvider } from './adapters/stripe/stripe.provider';
import { OrdersModule } from '../orders/orders.module';
import { RealtimeModule } from 'src/shared/realtime/realtime.module';

@Module({
  imports: [OrdersModule, RealtimeModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripeProvider,
    PaystackProvider,
    FlutterwaveProvider,
    BankTransferProvider,
  ],
  exports: [PaymentsService, BankTransferProvider],
})
export class PaymentsModule {}
