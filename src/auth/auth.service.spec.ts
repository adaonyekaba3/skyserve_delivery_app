import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/enums/role.enum';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<
      UsersService,
      'create' | 'findByEmail' | 'verifyPassword' | 'sanitizeUser' | 'findOne'
    >
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(() => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      verifyPassword: jest.fn(),
      sanitizeUser: jest.fn(),
      findOne: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  it('registers users as customers and returns an access token', async () => {
    usersService.create.mockResolvedValue({
      id: 'user-1',
      email: 'customer@example.com',
      fullName: 'SkyServe Customer',
      role: Role.CUSTOMER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.register({
      email: 'customer@example.com',
      fullName: 'SkyServe Customer',
      password: 'Customer123!',
    });

    expect(usersService.create).toHaveBeenCalledWith({
      email: 'customer@example.com',
      fullName: 'SkyServe Customer',
      password: 'Customer123!',
      role: Role.CUSTOMER,
    });
    expect(jwtService.sign).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('signed-jwt-token');
    expect(result.user.role).toBe(Role.CUSTOMER);
  });

  it('rejects login for unknown users', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'Customer123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns a token for valid credentials', async () => {
    const persistedUser = {
      id: 'user-1',
      email: 'customer@example.com',
      fullName: 'SkyServe Customer',
      passwordHash: 'hashed-password',
      role: Role.CUSTOMER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const safeUser = {
      id: 'user-1',
      email: 'customer@example.com',
      fullName: 'SkyServe Customer',
      role: Role.CUSTOMER,
      createdAt: persistedUser.createdAt,
      updatedAt: persistedUser.updatedAt,
    };

    usersService.findByEmail.mockResolvedValue(persistedUser as never);
    usersService.verifyPassword.mockResolvedValue(true);
    usersService.sanitizeUser.mockReturnValue(safeUser as never);

    const result = await service.login({
      email: 'customer@example.com',
      password: 'Customer123!',
    });

    expect(usersService.verifyPassword).toHaveBeenCalledWith(
      'Customer123!',
      'hashed-password',
    );
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'customer@example.com',
      role: Role.CUSTOMER,
    });
    expect(result.accessToken).toBe('signed-jwt-token');
    expect(result.user).toEqual(safeUser);
  });

  it('returns the current user without minting a new token for me()', async () => {
    usersService.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'customer@example.com',
      fullName: 'SkyServe Customer',
      role: Role.CUSTOMER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.me('user-1');

    expect(usersService.findOne).toHaveBeenCalledWith('user-1');
    expect(jwtService.sign).not.toHaveBeenCalled();
    expect(result).toHaveProperty('user');
    expect(result).not.toHaveProperty('accessToken');
  });
});
