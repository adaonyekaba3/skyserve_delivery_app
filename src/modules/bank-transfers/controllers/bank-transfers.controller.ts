import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Roles } from 'src/modules/identity/guards/roles.decorator';
import { Role } from 'src/shared/types/role.enum';
import { CurrentUser } from 'src/modules/identity/guards/current-user.decorator';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';
import { BankTransfersService } from '../application/bank-transfers.service';

class ApproveDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

class RejectDto {
  @IsString()
  @MaxLength(500)
  notes!: string;
}

@Controller({ path: 'bank-transfers', version: '1' })
export class BankTransfersController {
  constructor(private readonly bankTransfersService: BankTransfersService) {}

  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Get()
  list(@Query('status') status?: string) {
    return this.bankTransfersService.list(status);
  }

  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Patch(':id/approve')
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ApproveDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bankTransfersService.approve(id, user.dbUserId, dto.notes);
  }

  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Patch(':id/reject')
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bankTransfersService.reject(id, user.dbUserId, dto.notes);
  }
}
