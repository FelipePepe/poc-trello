import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtAccessPayload } from '../models/auth';
import { authSessionsRepo } from '../db/repositories/auth-sessions.repo';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; name: string; sessionId: string };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = header.slice(7);
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    res.status(500).json({ message: 'Server misconfigured: missing JWT_SECRET' });
    return;
  }

  let payload: JwtAccessPayload;
  try {
    payload = jwt.verify(token, secret) as JwtAccessPayload;
    if (payload.type !== 'access') {
      res.status(401).json({ message: 'Invalid token type' });
      return;
    }
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }

  const session = await authSessionsRepo.findById(payload.sid);
  if (!session) {
    res.status(401).json({ message: 'Session not found' });
    return;
  }

  if (session.revokedAt) {
    res.status(401).json({ message: 'Session revoked' });
    return;
  }

  if (new Date(session.expiresAt) < new Date()) {
    res.status(401).json({ message: 'Session expired' });
    return;
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    sessionId: payload.sid,
  };
  next();
};
