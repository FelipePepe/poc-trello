import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtAccessPayload } from '../models/auth';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { email: string };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
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

  try {
    const payload = jwt.verify(token, secret) as JwtAccessPayload;
    if (payload.type !== 'access') {
      res.status(401).json({ message: 'Invalid token type' });
      return;
    }
    req.user = { email: payload.email };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
