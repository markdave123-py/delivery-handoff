import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';

describe('Order Handoff Concurrency', () => {
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

  it('allows only one rider to start an order concurrently', async () => {
    // Create order
    const createRes = await request(app.getHttpServer())
      .post('/orders')
      .send();

    const orderId = createRes.body.orderId;

    const riderA = '550e8400-e29b-41d4-a716-446655440000';
    const riderB = '550e8400-e29b-41d4-a716-446655440001';

    // Fire concurrent start requests
    const [resA, resB] = await Promise.allSettled([
      request(app.getHttpServer())
        .post(`/orders/${orderId}/start`)
        .send({ riderId: riderA }),

      request(app.getHttpServer())
        .post(`/orders/${orderId}/start`)
        .send({ riderId: riderB }),
    ]);

    const successes = [resA, resB].filter(
      r => r.status === 'fulfilled' && r.value.status === 200
    );

    const conflicts = [resA, resB].filter(
      r => r.status === 'fulfilled' && r.value.status === 409
    );

    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(1);
  });

  it('allows sequential riders to work on the same order', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/orders')
      .send();
  
    const orderId = createRes.body.orderId;
  
    const riderA = '550e8400-e29b-41d4-a716-446655440010';
    const riderB = '550e8400-e29b-41d4-a716-446655440011';
  
    // Rider A starts
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/start`)
      .send({ riderId: riderA })
      .expect(200);
  
    // Rider A finishes
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/finish`)
      .send({ riderId: riderA })
      .expect(200);
  
    // Rider B starts
    const startB = await request(app.getHttpServer())
      .post(`/orders/${orderId}/start`)
      .send({ riderId: riderB })
      .expect(200);
  
    expect(startB.body.currentRiderId).toBe(riderB);
  });

  it('is idempotent when finishing multiple times', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/orders')
      .send();
  
    const orderId = createRes.body.orderId;
    const rider = '550e8400-e29b-41d4-a716-446655440099';
  
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/start`)
      .send({ riderId: rider });
  
    // Finish twice
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/finish`)
      .send({ riderId: rider })
      .expect(200);
  
    await request(app.getHttpServer())
      .post(`/orders/${orderId}/finish`)
      .send({ riderId: rider })
      .expect(200);
  });
  
  
});
