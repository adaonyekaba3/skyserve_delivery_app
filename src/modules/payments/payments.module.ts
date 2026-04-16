import { Module } from '@nestjs/common';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './application/payments.service';
import { PaystackProvider } from './adapters/paystack/paystack.provider';
import { FlutterwaveProvider } from './adapters/flutterwave/flutterwave.provider';
import { OutboxService } from 'src/shared/events/outbox.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaystackProvider,
    FlutterwaveProvider,
    OutboxService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
