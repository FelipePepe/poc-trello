import { Router } from 'express';
import {
  login,
  mfaSetup,
  mfaVerify,
  me,
  logout,
  refresh,
  reconfigureMfa,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/mfa/setup', mfaSetup);
router.post('/mfa/verify', mfaVerify);
router.post('/mfa/reconfigure', requireAuth, reconfigureMfa);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);
router.post('/refresh', refresh);

export default router;
