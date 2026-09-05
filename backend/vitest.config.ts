import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      // Dummy values — unit tests never open a DB connection; these only satisfy
      // the Zod env schema. No local PostgreSQL is required to run the tests.
      DATABASE_URL: 'postgresql://test:test@db.test.supabase.co:6543/postgres',
      DIRECT_URL: 'postgresql://test:test@db.test.supabase.co:5432/postgres',
      JWT_ACCESS_SECRET: 'test-access-secret-value',
      JWT_REFRESH_SECRET: 'test-refresh-secret-value',
    },
  },
});
