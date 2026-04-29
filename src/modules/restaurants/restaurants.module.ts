import { Module } from '@nestjs/common';
import { RestaurantsController } from './controllers/restaurants.controller';
import { RestaurantsService } from './application/restaurants.service';
import { RestaurantsRepository } from './restaurants.repository';

@Module({
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RestaurantsRepository],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
