import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { ah } from '../../utils/asyncHandler';
import { authController } from './auth.controller';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schemas';

export const authRoutes = Router();

authRoutes.post('/register', validate({ body: registerSchema }), ah(authController.register));
authRoutes.post('/login', validate({ body: loginSchema }), ah(authController.login));
authRoutes.post('/refresh', ah(authController.refresh));
authRoutes.post('/logout', ah(authController.logout));
authRoutes.post('/forgot-password', validate({ body: forgotPasswordSchema }), ah(authController.forgotPassword));
authRoutes.post('/reset-password', validate({ body: resetPasswordSchema }), ah(authController.resetPassword));
