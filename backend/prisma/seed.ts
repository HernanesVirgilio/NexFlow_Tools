import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@nexflow.tools';
  const passwordHash = await argon2.hash('demodemo');

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      profile: { create: { name: 'Demo User', language: 'en', theme: 'system' } },
    },
  });

  await prisma.workflow.upsert({
    where: { id: 'seed-workflow-1' },
    update: {},
    create: {
      id: 'seed-workflow-1',
      userId: user.id,
      name: 'Welcome workflow',
      description: 'A sample workflow. Point engineRef at an n8n webhook path to run it.',
      isActive: false,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded demo account: ${email} / demodemo`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
