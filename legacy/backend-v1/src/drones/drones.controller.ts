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
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CreateDroneDto } from './dto/create-drone.dto';
import { ListDronesDto } from './dto/list-drones.dto';
import { UpdateDroneDto } from './dto/update-drone.dto';
import { DronesService } from './drones.service';

@Roles(Role.ADMIN, Role.OPERATIONS)
@Controller({ path: 'drones', version: '1' })
export class DronesController {
  constructor(private readonly dronesService: DronesService) {}

  @Post()
  create(@Body() dto: CreateDroneDto) {
    return this.dronesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListDronesDto) {
    return this.dronesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.dronesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDroneDto,
  ) {
    return this.dronesService.update(id, dto);
  }
}
