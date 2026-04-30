import { Inject, Injectable } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';

@Injectable()
export class BaseRepository {
  constructor(
    @Inject(DrizzleService) protected readonly drizzleService: DrizzleService,
  ) {}

  protected get db() {
    return this.drizzleService.db;
  }
}
