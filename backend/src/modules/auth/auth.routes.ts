import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { ah } from '../../utils/asyncHandler';
import { authController } from './auth.controller';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  socialLoginParamsSchema,
} from './auth.schemas';

export const authRoutes = Router();

authRoutes.post('/register', validate({ body: registerSchema }), ah(authController.register));
authRoutes.post('/login', validate({ body: loginSchema }), ah(authController.login));
// Social sign-in — reserved endpoint. Returns 501 until an OAuth provider is configured.
authRoutes.post(
  '/social/:provider',
  validate({ params: socialLoginParamsSchema }),
  ah(authController.socialLogin),
);
authRoutes.post('/refresh', ah(authController.refresh));
authRoutes.post('/logout', ah(authController.logout));
authRoutes.post('/forgot-password', validate({ body: forgotPasswordSchema }), ah(authController.forgotPassword));
authRoutes.post('/reset-password', validate({ body: resetPasswordSchema }), ah(authController.resetPassword));
