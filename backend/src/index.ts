import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`NexFlow API listening on :${env.PORT}`, { env: env.NODE_ENV });
});

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => shutdown(s)));
