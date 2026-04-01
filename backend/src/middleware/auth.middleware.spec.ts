import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth } from './auth.middleware';

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

  it('returns 401 when Authorization header is missing', () => {
    const req = makeReq();
    const res = makeRes();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 when JWT secret is missing', () => {
    delete process.env.JWT_SECRET;
    const req = makeReq('Bearer abc');
    const res = makeRes();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 401 for non access tokens', () => {
    const token = jwt.sign({ type: 'mfa_pending', email: 'admin@example.com' }, 'test-secret');
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user and calls next for valid token', () => {
    const token = jwt.sign({ type: 'access', email: 'admin@example.com' }, 'test-secret');
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when token verification fails', () => {
    const req = makeReq('Bearer not-a-valid-token');
    const res = makeRes();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
