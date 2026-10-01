import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** In-memory Prisma double — no database, no network. */
const { db } = vi.hoisted(() => ({
  db: { integration: { findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() } },
}));
vi.mock('../src/lib/prisma', () => ({ prisma: db }));

import { createApp } from '../src/app';
import { signAccessToken, signOAuthState } from '../src/utils/jwt';

const app = createApp();
const token = signAccessToken({ sub: 'user-1', email: 'user@test.com' });
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/integrations', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/integrations');
    expect(res.status).toBe(401);
  });

  it('reports Google as configured=false and not connected — test env never sets GOOGLE_CLIENT_ID', async () => {
    db.integration.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/integrations').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ configured: false, integrations: [{ provider: 'google', connected: false }] });
  });

  it('reflects a real connected row for the requesting user only', async () => {
    db.integration.findUnique.mockResolvedValue({ accountEmail: 'me@gmail.com' });
    const res = await request(app).get('/api/integrations').set(auth());
    expect(res.body.integrations[0]).toMatchObject({ connected: true, accountEmail: 'me@gmail.com' });
    expect(db.integration.findUnique).toHaveBeenCalledWith({
      where: { userId_provider: { userId: 'user-1', provider: 'GOOGLE' } },
    });
  });
});

describe('GET /api/integrations/google/connect', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/integrations/google/connect');
    expect(res.status).toBe(401);
  });

  it('answers honestly when Google is not configured — never a fake connect URL', async () => {
    const res = await request(app).get('/api/integrations/google/connect').set(auth());
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('INTEGRATION_NOT_CONFIGURED');
    expect(res.body).not.toHaveProperty('url');
  });
});

describe('GET /api/integrations/google/callback — no Authorization header possible, state carries identity', () => {
  it('redirects to an error state on an invalid/forged state token', async () => {
    const res = await request(app).get('/api/integrations/google/callback').query({ code: 'x', state: 'not-a-real-token' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('status=error');
    expect(db.integration.upsert).not.toHaveBeenCalled();
  });

  it('redirects to a denied state when Google reports the user declined consent', async () => {
    const res = await request(app).get('/api/integrations/google/callback').query({ error: 'access_denied', state: 'x' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('status=denied');
  });

  it('never persists a connection when Google is not configured, even with a valid state', async () => {
    const state = signOAuthState('user-1');
    const res = await request(app).get('/api/integrations/google/callback').query({ code: 'real-code', state });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('status=error');
    expect(db.integration.upsert).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/integrations/google', () => {
  it('requires authentication', async () => {
    const res = await request(app).delete('/api/integrations/google');
    expect(res.status).toBe(401);
  });

  it('only deletes the requesting user’s own row', async () => {
    const res = await request(app).delete('/api/integrations/google').set(auth());
    expect(res.status).toBe(204);
    expect(db.integration.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1', provider: 'GOOGLE' } });
  });
});
