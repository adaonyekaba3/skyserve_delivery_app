import { Controller, Get } from '@nestjs/common';
import { AdminService } from '../application/admin.service';
import { Roles } from 'src/modules/identity/guards/roles.decorator';
import { Role } from 'src/shared/types/role.enum';

@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Get('overview')
  overview() {
    return this.adminService.overview();
  }

  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Get('insights')
  insights() {
    return this.adminService.insights();
  }
}
