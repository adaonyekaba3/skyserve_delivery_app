import { Module } from '@nestjs/common';
import { CartController } from './controllers/cart.controller';
import { CartService } from './application/cart.service';
import { CartRepository } from './cart.repository';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartService],
})
export class CartModule {}
