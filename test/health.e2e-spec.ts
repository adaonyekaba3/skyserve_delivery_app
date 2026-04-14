import { Test } from '@nestjs/testing';
import { HealthController } from 'src/health/health.controller';
import { HealthService } from 'src/health/health.service';

describe('Health Controller Integration', () => {
  it('returns the health payload from the service', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            check: jest.fn().mockResolvedValue({
              status: 'ok',
              database: 'up',
              uptimeSeconds: 42,
              timestamp: '2026-04-13T14:00:00.000Z',
            }),
          },
        },
      ],
    }).compile();

    const controller = moduleRef.get(HealthController);
    const result = await controller.check();

    expect(result).toEqual({
      status: 'ok',
      database: 'up',
      uptimeSeconds: 42,
      timestamp: '2026-04-13T14:00:00.000Z',
    });
  });
});
