import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** In-memory Prisma double — no database, no network (same convention as workflow.service.test.ts). */
const { db } = vi.hoisted(() => ({
  db: {
    user: { count: vi.fn(), findUnique: vi.fn() },
    workflow: { count: vi.fn() },
    workflowExecution: { count: vi.fn() },
  },
}));
vi.mock('../src/lib/prisma', () => ({ prisma: db }));

import { createApp } from '../src/app';
import { signAccessToken } from '../src/utils/jwt';

const app = createApp();

const userToken = signAccessToken({ sub: 'user-1', email: 'user@nexflow.tools', role: 'USER' });
const adminToken = signAccessToken({ sub: 'admin-1', email: 'admin@nexflow.tools', role: 'ADMIN' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/admin/overview — authorization gate', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/admin/overview');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(db.user.count).not.toHaveBeenCalled();
  });

  it('rejects an authenticated USER with 403 — never a silent empty response', async () => {
    const res = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(db.user.count).not.toHaveBeenCalled();
  });

  it('rejects a well-formed but garbage token with 401, not a crash', async () => {
    const res = await request(app).get('/api/admin/overview').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('allows an authenticated ADMIN and returns real (mocked) counts, never fabricated ones', async () => {
    db.user.count.mockResolvedValue(3);
    db.workflow.count.mockImplementation(({ where }: { where?: { isActive?: boolean } } = {}) =>
      Promise.resolve(where?.isActive ? 2 : 5),
    );
    db.workflowExecution.count.mockResolvedValue(9);

    const res = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totals: { users: 3, workflows: 5, activeWorkflows: 2, executions: 9 } });
  });
});

describe('regular user endpoints stay USER-accessible — requireRole never leaks onto them', () => {
  it('GET /api/users/me still works for a plain USER token', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@nexflow.tools',
      role: 'USER',
      profile: { name: 'Regular User', avatarUrl: null, language: 'en', theme: 'system' },
    });
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'user-1', role: 'USER' });
  });
});
