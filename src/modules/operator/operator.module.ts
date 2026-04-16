import { Module } from '@nestjs/common';
import { OperatorController } from './controllers/operator.controller';

@Module({
  controllers: [OperatorController],
})
export class OperatorModule {}
