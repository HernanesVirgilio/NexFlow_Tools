/**
 * NexFlow Tools — development / demo seed.
 *
 * Inserts a clearly fictional demo account with realistic workflows and
 * execution history so the app can be navigated without real user activity.
 *
 * SAFETY
 *  - Never runs against a production database unless ALLOW_DEMO_SEED=true.
 *  - Idempotent: the demo user's workflows + executions are rebuilt on every run;
 *    real users and their data are never touched.
 *  - All data below is fictional. Do not use real people's information.
 *
 * Run with:  npm run db:seed  (alias: npm run db:seed:demo)  — from repo root.
 */
import { PrismaClient, ExecutionStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@nexflow.tools';
const DEMO_PASSWORD = 'demodemo'; // development-only credential — never a real secret

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Fictional workflow catalogue. `active` ones get an engineRef so they are runnable. */
const WORKFLOWS = [
  {
    key: 'research',
    name: 'Research Assistant',
    description: 'Collects sources on a topic, summarises them and files the notes.',
    isActive: true,
    engineRef: 'demo/research-assistant',
  },
  {
    key: 'documents',
    name: 'Document Organizer',
    description: 'Sorts incoming files into folders and tags them by project.',
    isActive: true,
    engineRef: 'demo/document-organizer',
  },
  {
    key: 'productivity',
    name: 'Daily Productivity',
    description: 'Builds a morning digest from calendar, tasks and unread messages.',
    isActive: true,
    engineRef: 'demo/daily-productivity',
  },
  {
    key: 'deployment',
    name: 'Website Deployment',
    description: 'Runs the build, deploys to staging and posts the preview link.',
    isActive: false,
    engineRef: null as string | null,
  },
  {
    key: 'email',
    name: 'Email Processing',
    description: 'Triages the shared inbox, drafts replies and flags urgent threads.',
    isActive: false,
    engineRef: null as string | null,
  },
];

/**
 * 24 fictional executions. `agoH` = hours before "now" the run was created.
 * Durations are realistic for the kind of work each workflow does.
 */
const EXECUTIONS: Array<{
  workflow: string;
  status: ExecutionStatus;
  agoH: number;
  durationMin?: number;
  errorMessage?: string;
}> = [
  { workflow: 'research', status: 'COMPLETED', agoH: 2, durationMin: 3 },
  { workflow: 'research', status: 'COMPLETED', agoH: 26, durationMin: 4 },
  { workflow: 'research', status: 'FAILED', agoH: 50, durationMin: 1, errorMessage: 'Source API returned 503' },
  { workflow: 'research', status: 'COMPLETED', agoH: 74, durationMin: 3 },
  { workflow: 'research', status: 'RUNNING', agoH: 0.1 },
  { workflow: 'documents', status: 'COMPLETED', agoH: 5, durationMin: 1 },
  { workflow: 'documents', status: 'COMPLETED', agoH: 29, durationMin: 2 },
  { workflow: 'documents', status: 'COMPLETED', agoH: 53, durationMin: 1 },
  { workflow: 'documents', status: 'PENDING', agoH: 0.05 },
  { workflow: 'documents', status: 'COMPLETED', agoH: 101, durationMin: 2 },
  { workflow: 'productivity', status: 'COMPLETED', agoH: 8, durationMin: 1 },
  { workflow: 'productivity', status: 'COMPLETED', agoH: 32, durationMin: 1 },
  { workflow: 'productivity', status: 'COMPLETED', agoH: 56, durationMin: 1 },
  { workflow: 'productivity', status: 'FAILED', agoH: 80, durationMin: 1, errorMessage: 'Calendar credentials expired' },
  { workflow: 'productivity', status: 'COMPLETED', agoH: 104, durationMin: 1 },
  { workflow: 'productivity', status: 'COMPLETED', agoH: 128, durationMin: 1 },
  { workflow: 'deployment', status: 'COMPLETED', agoH: 12, durationMin: 6 },
  { workflow: 'deployment', status: 'FAILED', agoH: 36, durationMin: 4, errorMessage: 'Build failed: type error in checkout.ts' },
  { workflow: 'deployment', status: 'COMPLETED', agoH: 60, durationMin: 7 },
  { workflow: 'deployment', status: 'COMPLETED', agoH: 132, durationMin: 5 },
  { workflow: 'email', status: 'COMPLETED', agoH: 3, durationMin: 2 },
  { workflow: 'email', status: 'COMPLETED', agoH: 27, durationMin: 2 },
  { workflow: 'email', status: 'FAILED', agoH: 51, durationMin: 1, errorMessage: 'IMAP connection timed out' },
  { workflow: 'email', status: 'COMPLETED', agoH: 99, durationMin: 3 },
];

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error(
      'Refusing to run the demo seed with NODE_ENV=production. ' +
        'Set ALLOW_DEMO_SEED=true only if you really mean it.',
    );
  }

  const now = Date.now();
  const passwordHash = await argon2.hash(DEMO_PASSWORD);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      profile: { create: { name: 'Demo User', language: 'en', theme: 'system' } },
    },
    include: { profile: true },
  });

  if (!user.profile) {
    await prisma.profile.create({
      data: { userId: user.id, name: 'Demo User', language: 'en', theme: 'system' },
    });
  }

  // Rebuild only the demo user's workflow data. Executions cascade with workflows.
  await prisma.workflow.deleteMany({ where: { userId: user.id } });

  const idByKey = new Map<string, string>();
  for (const wf of WORKFLOWS) {
    const created = await prisma.workflow.create({
      data: {
        userId: user.id,
        name: wf.name,
        description: wf.description,
        isActive: wf.isActive,
        engine: 'n8n',
        engineRef: wf.engineRef,
        createdAt: new Date(now - 40 * DAY),
        updatedAt: new Date(now - Math.floor(Math.random() * 5) * DAY),
      },
    });
    idByKey.set(wf.key, created.id);
  }

  for (const ex of EXECUTIONS) {
    const workflowId = idByKey.get(ex.workflow)!;
    const createdAt = new Date(now - ex.agoH * HOUR);
    const finished = ex.status === 'COMPLETED' || ex.status === 'FAILED';
    const durationMs = ex.durationMin != null ? ex.durationMin * MINUTE : null;
    const startedAt = ex.status === 'PENDING' ? null : new Date(createdAt.getTime() + 2_000);
    const finishedAt = finished && startedAt && durationMs != null
      ? new Date(startedAt.getTime() + durationMs)
      : null;

    await prisma.workflowExecution.create({
      data: {
        workflowId,
        userId: user.id,
        status: ex.status,
        engineRef: ex.status === 'PENDING' ? null : `demo-run-${Math.random().toString(36).slice(2, 10)}`,
        startedAt,
        finishedAt,
        durationMs: finishedAt ? durationMs : null,
        errorMessage: ex.errorMessage ?? null,
        createdAt,
      },
    });
  }

  const active = WORKFLOWS.filter((w) => w.isActive).length;
  // eslint-disable-next-line no-console
  console.log(
    `Seeded demo account ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n` +
      `  ${WORKFLOWS.length} workflows (${active} active), ${EXECUTIONS.length} executions`,
  );
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
