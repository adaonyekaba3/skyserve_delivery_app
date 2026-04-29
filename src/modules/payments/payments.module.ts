import { Module } from '@nestjs/common';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './application/payments.service';
import { PaystackProvider } from './adapters/paystack/paystack.provider';
import { FlutterwaveProvider } from './adapters/flutterwave/flutterwave.provider';
import { OutboxService } from 'src/shared/events/outbox.service';
import { StripeProvider } from './adapters/stripe/stripe.provider';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripeProvider,
    PaystackProvider,
    FlutterwaveProvider,
    OutboxService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
