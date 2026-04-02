import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth } from './auth.middleware';

vi.mock('../db/repositories/auth-sessions.repo', () => ({
  authSessionsRepo: {
    findById: vi.fn(),
  },
}));

import { authSessionsRepo } from '../db/repositories/auth-sessions.repo';

const mockSession = {
  id: 'session-uuid-1',
  userId: 'user-uuid-1',
  tokenId: 'token-uuid-1',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  revokedAt: null,
  lastUsedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('requireAuth', () => {
  const makeReq = (authorization?: string) =>
    ({
      headers: authorization ? { authorization } : {},
    }) as Request;

  const makeRes = () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    return { status, json } as unknown as Response;
  };

  const next = vi.fn() as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = makeReq();
    const res = makeRes();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 when JWT secret is missing', async () => {
    delete process.env.JWT_SECRET;
    const req = makeReq('Bearer abc');
    const res = makeRes();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 401 for non access tokens', async () => {
    const token = jwt.sign({ type: 'mfa_pending', email: 'alice@example.com' }, 'test-secret');
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token verification fails', async () => {
    const req = makeReq('Bearer not-a-valid-token');
    const res = makeRes();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets full req.user and calls next for valid token with active session', async () => {
    const token = jwt.sign(
      {
        type: 'access',
        sub: 'user-uuid-1',
        email: 'alice@example.com',
        name: 'Alice',
        sid: 'session-uuid-1',
      },
      'test-secret',
    );
    vi.mocked(authSessionsRepo.findById).mockResolvedValue(mockSession);
    const req = makeReq(`Bearer ${token}`) as Request & { user?: unknown };
    const res = makeRes();
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject({
      id: 'user-uuid-1',
      email: 'alice@example.com',
      name: 'Alice',
      sessionId: 'session-uuid-1',
    });
  });

  it('returns 401 when session is not found', async () => {
    const token = jwt.sign(
      {
        type: 'access',
        sub: 'user-uuid-1',
        email: 'alice@example.com',
        name: 'Alice',
        sid: 'session-uuid-1',
      },
      'test-secret',
    );
    vi.mocked(authSessionsRepo.findById).mockResolvedValue(null);
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when session is revoked', async () => {
    const token = jwt.sign(
      {
        type: 'access',
        sub: 'user-uuid-1',
        email: 'alice@example.com',
        name: 'Alice',
        sid: 'session-uuid-1',
      },
      'test-secret',
    );
    vi.mocked(authSessionsRepo.findById).mockResolvedValue({
      ...mockSession,
      revokedAt: new Date(Date.now() - 1000).toISOString(),
    });
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when session is expired', async () => {
    const token = jwt.sign(
      {
        type: 'access',
        sub: 'user-uuid-1',
        email: 'alice@example.com',
        name: 'Alice',
        sid: 'session-uuid-1',
      },
      'test-secret',
    );
    vi.mocked(authSessionsRepo.findById).mockResolvedValue({
      ...mockSession,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
