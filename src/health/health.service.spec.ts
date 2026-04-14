import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns an ok health response when the database check succeeds', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
    };

    const service = new HealthService(prisma as never);
    const result = await service.check();

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(result.timestamp).toEqual(expect.any(String));
    expect(result.uptimeSeconds).toEqual(expect.any(Number));
  });
});
