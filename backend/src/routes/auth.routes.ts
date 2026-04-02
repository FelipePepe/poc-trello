import { Router } from 'express';
import { login, mfaSetup, mfaVerify, me, logout, refresh } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/mfa/setup', mfaSetup);
router.post('/mfa/verify', mfaVerify);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);
router.post('/refresh', refresh);

export default router;
