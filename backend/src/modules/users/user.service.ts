import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { hashPassword, verifyPassword } from '../../utils/password';
import { updateProfileSchema, changePasswordSchema } from './user.schemas';

const shape = {
  id: true,
  email: true,
  role: true,
  profile: { select: { name: true, avatarUrl: true, language: true, theme: true } },
} as const;

function flatten(u: {
  id: string;
  email: string;
  role: Role;
  profile: { name: string; avatarUrl: string | null; language: string; theme: string } | null;
}) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    ...(u.profile ?? { name: '', avatarUrl: null, language: 'en', theme: 'system' }),
  };
}

export const userService = {
  async me(userId: string) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: shape });
    if (!u) throw AppError.notFound('User not found');
    return flatten(u);
  },

  async updateProfile(userId: string, input: z.infer<typeof updateProfileSchema>) {
    await prisma.profile.update({ where: { userId }, data: input });
    return this.me(userId);
  },

  async changePassword(userId: string, input: z.infer<typeof changePasswordSchema>) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await verifyPassword(user.passwordHash, input.currentPassword))) {
      throw AppError.badRequest('Current password is incorrect');
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(input.newPassword) } }),
      prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
  },
};
