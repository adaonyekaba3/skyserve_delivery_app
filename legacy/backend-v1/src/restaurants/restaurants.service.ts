import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { ListRestaurantsDto } from './dto/list-restaurants.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRestaurantDto, user: AuthenticatedUser) {
    const ownerId =
      user.role === Role.RESTAURANT_OWNER ? user.sub : dto.ownerId;

    return this.prisma.restaurant.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }

  findAll(query: ListRestaurantsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    return this.prisma.restaurant.findMany({
      where: {
        ...(query.status && { status: query.status }),
        ...(query.ownerId && { ownerId: query.ownerId }),
      },
      orderBy: { [sortBy]: sortOrder } as never,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findMine(user: AuthenticatedUser, query: ListRestaurantsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    return this.prisma.restaurant.findMany({
      where: {
        ownerId: user.sub,
        ...(query.status && { status: query.status }),
      },
      orderBy: { [sortBy]: sortOrder } as never,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async update(id: string, dto: UpdateRestaurantDto, user: AuthenticatedUser) {
    const restaurant = await this.findOne(id);

    if (
      user.role === Role.RESTAURANT_OWNER &&
      restaurant.ownerId !== user.sub
    ) {
      throw new ForbiddenException('You can only update your own restaurants');
    }

    const ownerId =
      user.role === Role.RESTAURANT_OWNER
        ? user.sub
        : (dto.ownerId ?? restaurant.ownerId);

    return this.prisma.restaurant.update({
      where: { id },
      data: {
        ...dto,
        ownerId,
      },
    });
  }
}
