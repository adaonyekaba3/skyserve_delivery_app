import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from 'src/auth/auth.controller';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { AuthService } from 'src/auth/auth.service';

describe('Auth Controller Integration', () => {
  const authService = {
    register: jest.fn().mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'customer@example.com',
        fullName: 'SkyServe Customer',
        role: 'CUSTOMER',
      },
      accessToken: 'jwt-token',
    }),
    login: jest.fn().mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'customer@example.com',
        fullName: 'SkyServe Customer',
        role: 'CUSTOMER',
      },
      accessToken: 'jwt-token',
    }),
    me: jest.fn(),
  };

  let controller: AuthController;
  let validationPipe: ValidationPipe;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = moduleRef.get(AuthController);
    validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  it('registers a user through the controller boundary', async () => {
    const dto = await validationPipe.transform(
      {
        fullName: 'SkyServe Customer',
        email: 'customer@example.com',
        password: 'Customer123!',
      },
      {
        type: 'body',
        metatype: RegisterDto,
      } satisfies ArgumentMetadata,
    );

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith({
      fullName: 'SkyServe Customer',
      email: 'customer@example.com',
      password: 'Customer123!',
    });
    expect(result.accessToken).toBe('jwt-token');
  });

  it('rejects invalid login payloads with validation errors', async () => {
    await expect(
      validationPipe.transform(
        {
          email: 'not-an-email',
          password: 'short',
        },
        {
          type: 'body',
          metatype: LoginDto,
        } satisfies ArgumentMetadata,
      ),
    ).rejects.toThrow();

    expect(authService.login).not.toHaveBeenCalled();
  });
});
