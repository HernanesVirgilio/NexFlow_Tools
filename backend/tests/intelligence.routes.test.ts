import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { signAccessToken } from '../src/utils/jwt';

const app = createApp();
const token = signAccessToken({ sub: 'user-1', email: 'user@test.com' });
const auth = () => ({ Authorization: `Bearer ${token}` });

describe('POST /api/intelligence/generate', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).post('/api/intelligence/generate').send({ message: 'hi', mode: 'ask' });
    expect(res.status).toBe(401);
  });

  it('rejects invalid input (empty message) with 400', async () => {
    const res = await request(app).post('/api/intelligence/generate').set(auth()).send({ message: '', mode: 'ask' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an unknown mode with 400', async () => {
    const res = await request(app)
      .post('/api/intelligence/generate')
      .set(auth())
      .send({ message: 'hi', mode: 'not-a-real-mode' });
    expect(res.status).toBe(400);
  });

  it('answers honestly when the provider is not configured — no fake AI response', async () => {
    // Test env never sets GEMINI_API_KEY (see vitest.config.ts) — this exercises the real path.
    const res = await request(app)
      .post('/api/intelligence/generate')
      .set(auth())
      .send({ message: 'Explain Kubernetes', mode: 'ask' });
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('INTELLIGENCE_NOT_CONFIGURED');
    expect(res.body).not.toHaveProperty('content');
  });

  it('answers honestly for a not-yet-implemented capability', async () => {
    const res = await request(app)
      .post('/api/intelligence/generate')
      .set(auth())
      .send({ message: 'make me a poster', mode: 'image' });
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('INTELLIGENCE_MODE_NOT_IMPLEMENTED');
  });

  it('rate-limits repeated requests from the same user', async () => {
    const attempts = Array.from({ length: 13 }, () =>
      request(app).post('/api/intelligence/generate').set(auth()).send({ message: 'hi', mode: 'ask' }),
    );
    const results = await Promise.all(attempts);
    const statuses = results.map((r) => r.status);
    expect(statuses).toContain(429);
  });
});
