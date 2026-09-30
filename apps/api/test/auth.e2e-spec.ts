import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/users/prisma.service.js';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  const users = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      passwordHash: string;
      role: 'PASSENGER' | 'DRIVER';
      createdAt: Date;
      updatedAt: Date;
    }
  >();
  const prismaMock = {
    user: {
      findUnique: vi.fn(
        async ({ where }: { where: { email?: string; id?: string } }) => {
          if (where.email) {
            return [...users.values()].find((user) => user.email === where.email) ?? null;
          }

          return where.id ? (users.get(where.id) ?? null) : null;
        },
      ),
      create: vi.fn(
        async ({
          data,
        }: {
          data: {
            name: string;
            email: string;
            passwordHash: string;
            role: 'PASSENGER' | 'DRIVER';
          };
        }) => {
          const user = {
            id: randomUUID(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          users.set(user.id, user);
          return user;
        },
      ),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user and excludes passwordHash from the response', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Nusrat',
        email: 'nusrat@example.com',
        password: 'secure-password',
        role: 'PASSENGER',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Nusrat',
      email: 'nusrat@example.com',
      role: 'PASSENGER',
    });
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate email registration', async () => {
    const payload = {
      name: 'Rafiq',
      email: 'rafiq@example.com',
      password: 'secure-password',
      role: 'PASSENGER',
    };

    await request(app.getHttpServer()).post('/auth/register').send(payload).expect(201);
    await request(app.getHttpServer()).post('/auth/register').send(payload).expect(409);
  });

  it('logs in with valid credentials and returns a JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'nusrat@example.com',
        password: 'secure-password',
      })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'nusrat@example.com',
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('rejects a request without a bearer token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('accepts a valid bearer token for the current-user endpoint', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'nusrat@example.com',
        password: 'secure-password',
      })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'Nusrat',
      email: 'nusrat@example.com',
      role: 'PASSENGER',
    });
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid registration input', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: '   ',
        email: 'not-an-email',
        password: 'short',
        role: 'PASSENGER',
      })
      .expect(400);
  });
});
