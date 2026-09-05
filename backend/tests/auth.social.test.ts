import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

const app = createApp();

describe('POST /api/auth/social/:provider', () => {
  it('rejects an unknown provider with 400', async () => {
    const res = await request(app).post('/api/auth/social/myspace');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 501 for a known provider — never a fake session', async () => {
    const res = await request(app).post('/api/auth/social/google');
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('SOCIAL_AUTH_NOT_CONFIGURED');
    expect(res.body).not.toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeUndefined();
  });
});
