import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IdentityModule } from './modules/identity/identity.module';
import { UsersModule } from './modules/users/users.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OperatorModule } from './modules/operator/operator.module';
import { AuditModule } from './modules/audit/audit.module';
import { DronesModule } from './modules/drones/drones.module';
import { AdminModule } from './modules/admin/admin.module';
import { CartModule } from './modules/cart/cart.module';
import { PackagesModule } from './modules/packages/packages.module';
import { BankTransfersModule } from './modules/bank-transfers/bank-transfers.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { DatabaseModule } from './shared/database/database.module';
import { RealtimeModule } from './shared/realtime/realtime.module';
import { EventsModule } from './shared/events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    RealtimeModule,
    EventsModule,
    IdentityModule,
    UsersModule,
    RestaurantsModule,
    CatalogModule,
    OrdersModule,
    DispatchModule,
    FleetModule,
    DeliveriesModule,
    PaymentsModule,
    OperatorModule,
    AuditModule,
    DronesModule,
    AdminModule,
    CartModule,
    PackagesModule,
    BankTransfersModule,
    UploadsModule,
  ],
})
export class AppModule {}
