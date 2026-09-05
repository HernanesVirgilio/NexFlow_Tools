import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ah } from '../../utils/asyncHandler';
import { userService } from './user.service';
import { changePasswordSchema, updateProfileSchema } from './user.schemas';

export const userRoutes = Router();
userRoutes.use(requireAuth);

userRoutes.get('/me', ah(async (req, res) => {
  res.json(await userService.me(req.user!.id));
}));

userRoutes.patch('/me', validate({ body: updateProfileSchema }), ah(async (req, res) => {
  res.json(await userService.updateProfile(req.user!.id, req.body));
}));

userRoutes.post('/me/password', validate({ body: changePasswordSchema }), ah(async (req, res) => {
  await userService.changePassword(req.user!.id, req.body);
  res.json({ message: 'Password changed. Please sign in again.' });
}));
