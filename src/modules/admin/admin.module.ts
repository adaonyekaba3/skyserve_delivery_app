import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './application/admin.service';
import { AdminRepository } from './admin.repository';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
  exports: [AdminService],
})
export class AdminModule {}
