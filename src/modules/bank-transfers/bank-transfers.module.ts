import { Module } from '@nestjs/common';
import { BankTransfersController } from './controllers/bank-transfers.controller';
import { BankTransfersService } from './application/bank-transfers.service';
import { BankTransfersRepository } from './bank-transfers.repository';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [BankTransfersController],
  providers: [BankTransfersService, BankTransfersRepository],
  exports: [BankTransfersService],
})
export class BankTransfersModule {}
