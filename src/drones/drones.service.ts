import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DroneStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDroneDto } from './dto/create-drone.dto';
import { ListDronesDto } from './dto/list-drones.dto';
import { UpdateDroneDto } from './dto/update-drone.dto';

@Injectable()
export class DronesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDroneDto) {
    try {
      return await this.prisma.drone.create({
        data: {
          ...dto,
          status: dto.status ?? DroneStatus.IDLE,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A drone with that serial number already exists',
        );
      }

      throw error;
    }
  }

  findAll(query: ListDronesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    return this.prisma.drone.findMany({
      where: {
        ...(query.status && { status: query.status }),
      },
      include: {
        deliveries: true,
      },
      orderBy: { [sortBy]: sortOrder } as never,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string) {
    const drone = await this.prisma.drone.findUnique({
      where: { id },
      include: {
        deliveries: true,
      },
    });

    if (!drone) {
      throw new NotFoundException('Drone not found');
    }

    return drone;
  }

  async update(id: string, dto: UpdateDroneDto) {
    await this.ensureExists(id);

    try {
      return await this.prisma.drone.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A drone with that serial number already exists',
        );
      }

      throw error;
    }
  }

  private async ensureExists(id: string) {
    const drone = await this.prisma.drone.findUnique({ where: { id } });

    if (!drone) {
      throw new NotFoundException('Drone not found');
    }
  }
}
