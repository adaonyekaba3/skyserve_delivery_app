import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects protected route without bearer token', async () => {
    await request(app.getHttpServer()).get('/api/v1/orders').expect(401);
  });

  it('accepts public clerk webhook route', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/identity/webhooks/clerk')
      .send({ type: 'user.created' })
      .expect(201);
  });
});
