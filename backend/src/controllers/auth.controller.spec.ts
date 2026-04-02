import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { createMockResponse } from '../test-utils/http-mocks';
import { login, mfaSetup, mfaVerify, me, logout, refresh } from './auth.controller';

vi.mock('../db/repositories/users.repo', () => ({
  usersRepo: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../db/repositories/auth-sessions.repo', () => ({
  authSessionsRepo: {
    create: vi.fn(),
    findById: vi.fn(),
    findByTokenId: vi.fn(),
    revoke: vi.fn(),
    rotate: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock('otplib', () => ({
  generateURI: vi.fn(() => 'otpauth://totp/Trello'),
  verifySync: vi.fn(() => ({ valid: true })),
}));

import * as otp from 'otplib';
import { usersRepo } from '../db/repositories/users.repo';
import { authSessionsRepo } from '../db/repositories/auth-sessions.repo';
import bcrypt from 'bcryptjs';

const mockUser = {
  id: 'user-uuid-1',
  email: 'alice@example.com',
  name: 'Alice',
  passwordHash: '$2b$10$hashedpassword',
  mfaSecret: 'BASE32SECRET',
  mfaEnabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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

describe('auth.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'jwt-secret';
    process.env.MFA_SECRET = 'BASE32SECRET';
    process.env.JWT_EXPIRY = '24h';
  });

  // --- login ---

  it('login returns 400 for missing credentials', async () => {
    const { res, status } = createMockResponse();
    await login({ body: { email: '', password: '' } } as Request, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it('login returns 401 for unknown email', async () => {
    vi.mocked(usersRepo.findByEmail).mockResolvedValue(null);
    const { res, status, json } = createMockResponse();
    await login({ body: { email: 'unknown@example.com', password: 'x' } } as Request, res);
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: 'Credenciales incorrectas' });
  });

  it('login returns 401 for wrong password (same shape as unknown user)', async () => {
    vi.mocked(usersRepo.findByEmail).mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const { res, status, json } = createMockResponse();
    await login({ body: { email: mockUser.email, password: 'wrong' } } as Request, res);
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: 'Credenciales incorrectas' });
  });

  it('login with MFA enabled returns tempToken (sub = userId)', async () => {
    vi.mocked(usersRepo.findByEmail).mockResolvedValue({ ...mockUser, mfaEnabled: true });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.spyOn(jwt, 'sign').mockReturnValue('temp-token' as never);
    const { res, json } = createMockResponse();
    await login({ body: { email: mockUser.email, password: 'correct' } } as Request, res);
    expect(json).toHaveBeenCalledWith({ mfaRequired: true, tempToken: 'temp-token' });
  });

  it('login with MFA disabled creates session and returns accessToken + refreshToken', async () => {
    vi.mocked(usersRepo.findByEmail).mockResolvedValue({ ...mockUser, mfaEnabled: false });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(authSessionsRepo.create).mockResolvedValue(mockSession);
    vi.spyOn(jwt, 'sign').mockReturnValue('access-token' as never);
    const { res, json } = createMockResponse();
    await login({ body: { email: mockUser.email, password: 'correct' } } as Request, res);
    expect(authSessionsRepo.create).toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: expect.any(String),
        user: expect.objectContaining({ email: mockUser.email }),
      }),
    );
  });

  // --- mfaSetup ---

  it('mfaSetup returns 401 when header is missing', async () => {
    const { res, status } = createMockResponse();
    await mfaSetup({ headers: {} } as Request, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it('mfaSetup returns 401 when temp token is invalid', async () => {
    vi.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('invalid token');
    });
    const { res, status } = createMockResponse();
    await mfaSetup({ headers: { authorization: 'Bearer invalid' } } as unknown as Request, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it('mfaSetup returns 503 when MFA secret is unavailable', async () => {
    delete process.env.MFA_SECRET;
    delete process.env._MFA_SESSION_SECRET;
    vi.spyOn(jwt, 'verify').mockReturnValue({ type: 'mfa_pending', sub: mockUser.id } as never);
    vi.mocked(usersRepo.findById).mockResolvedValue({ ...mockUser, mfaSecret: null });
    const { res, status } = createMockResponse();
    await mfaSetup({ headers: { authorization: 'Bearer temp' } } as unknown as Request, res);
    expect(status).toHaveBeenCalledWith(503);
  });

  it('mfaSetup returns provisioning payload', async () => {
    vi.spyOn(jwt, 'verify').mockReturnValue({ type: 'mfa_pending', sub: mockUser.id } as never);
    vi.mocked(usersRepo.findById).mockResolvedValue(mockUser);
    vi.mocked(otp.generateURI).mockReturnValue('otpauth://totp/Trello');
    vi.spyOn(QRCode, 'toDataURL').mockResolvedValue('data:image/png;base64,qrcode' as never);
    const { res, json } = createMockResponse();
    await mfaSetup({ headers: { authorization: 'Bearer temp' } } as unknown as Request, res);
    expect(json).toHaveBeenCalled();
  });

  // --- mfaVerify ---

  it('mfaVerify returns 400 for missing fields', async () => {
    const { res, status } = createMockResponse();
    await mfaVerify({ body: { tempToken: '', code: '' } } as Request, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it('mfaVerify returns 401 for invalid temp token', async () => {
    vi.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('invalid token');
    });
    const { res, status } = createMockResponse();
    await mfaVerify({ body: { tempToken: 'bad', code: '123456' } } as Request, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it('mfaVerify returns 401 for invalid OTP', async () => {
    vi.spyOn(jwt, 'verify').mockReturnValue({ type: 'mfa_pending', sub: mockUser.id } as never);
    vi.mocked(otp.verifySync).mockReturnValue({ valid: false } as never);
    vi.mocked(usersRepo.findById).mockResolvedValue(mockUser);
    const { res, status } = createMockResponse();
    await mfaVerify({ body: { tempToken: 'temp', code: '000000' } } as Request, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it('mfaVerify returns 503 when server MFA secret is missing', async () => {
    delete process.env.MFA_SECRET;
    delete process.env._MFA_SESSION_SECRET;
    vi.spyOn(jwt, 'verify').mockReturnValue({ type: 'mfa_pending', sub: mockUser.id } as never);
    vi.mocked(usersRepo.findById).mockResolvedValue({ ...mockUser, mfaSecret: null });
    const { res, status } = createMockResponse();
    await mfaVerify({ body: { tempToken: 'temp', code: '123456' } } as Request, res);
    expect(status).toHaveBeenCalledWith(503);
  });

  it('mfaVerify creates session and returns accessToken + refreshToken + user', async () => {
    vi.spyOn(jwt, 'verify').mockReturnValue({ type: 'mfa_pending', sub: mockUser.id } as never);
    vi.mocked(otp.verifySync).mockReturnValue({ valid: true } as never);
    vi.mocked(usersRepo.findById).mockResolvedValue(mockUser);
    vi.mocked(authSessionsRepo.create).mockResolvedValue(mockSession);
    vi.spyOn(jwt, 'sign').mockReturnValue('access-token' as never);
    const { res, json } = createMockResponse();
    await mfaVerify({ body: { tempToken: 'temp', code: '123456' } } as Request, res);
    expect(authSessionsRepo.create).toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: expect.any(String),
        user: expect.objectContaining({ email: mockUser.email }),
      }),
    );
  });

  // --- me ---

  it('me returns id, email, name from req.user', () => {
    const { res, json } = createMockResponse();
    const mockReqUser = {
      id: 'user-uuid-1',
      email: 'alice@example.com',
      name: 'Alice',
      sessionId: 'session-uuid-1',
    };
    me({ user: mockReqUser } as unknown as Request, res);
    expect(json).toHaveBeenCalledWith({
      id: 'user-uuid-1',
      email: 'alice@example.com',
      name: 'Alice',
    });
  });

  // --- logout ---

  it('logout revokes session and returns 200', async () => {
    vi.mocked(authSessionsRepo.revoke).mockResolvedValue(undefined);
    const { res, json } = createMockResponse();
    const mockReqUser = {
      id: 'user-uuid-1',
      email: 'alice@example.com',
      name: 'Alice',
      sessionId: 'session-uuid-1',
    };
    await logout({ user: mockReqUser } as unknown as Request, res);
    expect(authSessionsRepo.revoke).toHaveBeenCalledWith('session-uuid-1');
    expect(json).toHaveBeenCalledWith({ message: 'Sesión cerrada exitosamente' });
  });

  // --- refresh ---

  it('refresh returns 400 when refreshToken is missing', async () => {
    const { res, status } = createMockResponse();
    await refresh({ body: {} } as Request, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it('refresh returns 401 when session not found', async () => {
    vi.mocked(authSessionsRepo.findByTokenId).mockResolvedValue(null);
    const { res, status } = createMockResponse();
    await refresh({ body: { refreshToken: 'some-token-uuid' } } as Request, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it('refresh returns 401 when session is revoked', async () => {
    vi.mocked(authSessionsRepo.findByTokenId).mockResolvedValue({
      ...mockSession,
      revokedAt: new Date(Date.now() - 1000).toISOString(),
    });
    const { res, status } = createMockResponse();
    await refresh({ body: { refreshToken: 'some-token-uuid' } } as Request, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it('refresh returns 401 when session is expired', async () => {
    vi.mocked(authSessionsRepo.findByTokenId).mockResolvedValue({
      ...mockSession,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    const { res, status } = createMockResponse();
    await refresh({ body: { refreshToken: 'some-token-uuid' } } as Request, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it('refresh rotates session and returns new accessToken + refreshToken', async () => {
    vi.mocked(authSessionsRepo.findByTokenId).mockResolvedValue(mockSession);
    vi.mocked(authSessionsRepo.rotate).mockResolvedValue({
      ...mockSession,
      id: 'new-session-uuid',
    });
    vi.mocked(usersRepo.findById).mockResolvedValue(mockUser);
    vi.spyOn(jwt, 'sign').mockReturnValue('new-access-token' as never);
    const { res, json } = createMockResponse();
    await refresh({ body: { refreshToken: 'some-token-uuid' } } as Request, res);
    expect(authSessionsRepo.rotate).toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'new-access-token',
        refreshToken: expect.any(String),
      }),
    );
  });
});
