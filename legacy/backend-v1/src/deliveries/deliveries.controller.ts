import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  AuthenticatedUser,
  CurrentUser,
} from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { ListDeliveriesDto } from './dto/list-deliveries.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { DeliveriesService } from './deliveries.service';

@Controller({ path: 'deliveries', version: '1' })
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Post()
  create(
    @Body() dto: CreateDeliveryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deliveriesService.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDeliveriesDto,
  ) {
    return this.deliveriesService.findAll(user, query);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deliveriesService.findOne(id, user);
  }

  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDeliveryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deliveriesService.update(id, dto, user);
  }
}
