import { Injectable } from '@nestjs/common';
import { AdminRepository } from '../admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  overview() {
    return this.adminRepository.overview();
  }

  insights() {
    return this.adminRepository.insights();
  }
}
