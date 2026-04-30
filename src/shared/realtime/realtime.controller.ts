import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { PusherService } from './pusher.service';
import { CurrentUser } from 'src/modules/identity/guards/current-user.decorator';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';
import { Role } from 'src/shared/types/role.enum';

class PusherAuthDto {
  @IsString()
  socket_id!: string;

  @IsString()
  channel_name!: string;
}

@Controller({ path: 'realtime', version: '1' })
export class RealtimeController {
  constructor(private readonly pusherService: PusherService) {}

  @Post('auth')
  authorize(
    @Body() body: PusherAuthDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { channel_name: channel, socket_id: socketId } = body;
    this.assertCanSubscribe(channel, user);
    return this.pusherService.authorizeChannel(socketId, channel);
  }

  private assertCanSubscribe(channel: string, user: AuthenticatedUser): void {
    if (channel.startsWith('private-customer-')) {
      const requested = channel.slice('private-customer-'.length);
      if (requested !== user.dbUserId) {
        throw new ForbiddenException(
          'Cannot subscribe to another customer channel',
        );
      }
      return;
    }
    if (channel.startsWith('private-restaurant-')) {
      const requested = channel.slice('private-restaurant-'.length);
      if (
        user.role === Role.ADMIN ||
        user.role === Role.OPERATIONS ||
        user.restaurantIds.includes(requested)
      ) {
        return;
      }
      throw new ForbiddenException(
        'Cannot subscribe to this restaurant channel',
      );
    }
    if (channel === 'private-admin' || channel.startsWith('private-admin-')) {
      if (user.role === Role.ADMIN || user.role === Role.OPERATIONS) {
        return;
      }
      throw new ForbiddenException('Admin role required');
    }
    throw new ForbiddenException(`Channel not recognized: ${channel}`);
  }
}
