import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/enums/role.enum';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create({
      ...dto,
      role: Role.CUSTOMER,
    } satisfies CreateUserDto);

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.usersService.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(this.usersService.sanitizeUser(user));
  }

  async me(userId: string) {
    const user = await this.usersService.findOne(userId);
    return this.buildAuthResponse(user, false);
  }

  private buildAuthResponse(
    user: Awaited<ReturnType<UsersService['findOne']>>,
    includeToken = true,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      user,
      ...(includeToken && {
        accessToken: this.jwtService.sign(payload),
      }),
    };
  }
}
