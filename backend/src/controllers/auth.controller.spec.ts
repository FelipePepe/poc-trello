import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { createMockResponse } from '../test-utils/http-mocks';
import { login, mfaSetup, mfaVerify, me } from './auth.controller';

vi.mock('otplib', () => ({
  generateURI: vi.fn(() => 'otpauth://totp/Trello'),
  verifySync: vi.fn(() => ({ valid: true })),
}));

import * as otp from 'otplib';

describe('auth.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'admin123';
    process.env.JWT_SECRET = 'jwt-secret';
    process.env.MFA_SECRET = 'BASE32SECRET';
    process.env.JWT_EXPIRY = '24h';
  });

  it('login returns 400 for missing credentials', () => {
    const { res, status } = createMockResponse();

    login({ body: { email: '', password: '' } } as Request, res);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('login returns 401 for invalid credentials', () => {
    const { res, status } = createMockResponse();

    login({ body: { email: 'wrong@example.com', password: 'x' } } as Request, res);

    expect(status).toHaveBeenCalledWith(401);
  });

  it('login returns temporary MFA token', () => {
    vi.spyOn(jwt, 'sign').mockReturnValue('temp-token' as never);
    const { res, json } = createMockResponse();

    login({ body: { email: 'admin@example.com', password: 'admin123' } } as Request, res);

    expect(json).toHaveBeenCalledWith({ mfaRequired: true, tempToken: 'temp-token' });
  });

  it('mfaSetup returns 401 when header is missing', async () => {
    const { res, status } = createMockResponse();

    await mfaSetup({ headers: {} } as Request, res);

    expect(status).toHaveBeenCalledWith(401);
  });

  it('mfaSetup returns 503 when MFA secret is unavailable', async () => {
    delete process.env.MFA_SECRET;
    delete process.env._MFA_SESSION_SECRET;
    vi.spyOn(jwt, 'verify').mockReturnValue({ type: 'mfa_pending' } as never);
    const { res, status } = createMockResponse();

    await mfaSetup({ headers: { authorization: 'Bearer temp' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(503);
  });

  it('mfaSetup returns 401 when temp token is invalid', async () => {
    vi.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('invalid token');
    });
    const { res, status } = createMockResponse();

    await mfaSetup({ headers: { authorization: 'Bearer invalid' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(401);
  });

  it('mfaSetup returns provisioning payload', async () => {
    vi.spyOn(jwt, 'verify').mockReturnValue({ type: 'mfa_pending' } as never);
    vi.mocked(otp.generateURI).mockReturnValue('otpauth://totp/Trello');
    vi.spyOn(QRCode, 'toDataURL').mockResolvedValue('data:image/png;base64,qrcode' as never);
    const { res, json } = createMockResponse();

    await mfaSetup({ headers: { authorization: 'Bearer temp' } } as unknown as Request, res);

    expect(json).toHaveBeenCalled();
  });

  it('mfaVerify returns 400 for missing fields', () => {
    const { res, status } = createMockResponse();

    mfaVerify({ body: { tempToken: '', code: '' } } as Request, res);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('mfaVerify returns 401 for invalid OTP', () => {
    vi.spyOn(jwt, 'verify').mockReturnValue({
      type: 'mfa_pending',
      sub: 'admin@example.com',
    } as never);
    vi.mocked(otp.verifySync).mockReturnValue({ valid: false } as never);
    const { res, status } = createMockResponse();

    mfaVerify({ body: { tempToken: 'temp', code: '000000' } } as Request, res);

    expect(status).toHaveBeenCalledWith(401);
  });

  it('mfaVerify returns 401 for invalid temp token', () => {
    vi.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('invalid token');
    });
    const { res, status } = createMockResponse();

    mfaVerify({ body: { tempToken: 'bad', code: '123456' } } as Request, res);

    expect(status).toHaveBeenCalledWith(401);
  });

  it('mfaVerify returns 503 when server MFA secret is missing', () => {
    delete process.env.MFA_SECRET;
    delete process.env._MFA_SESSION_SECRET;
    vi.spyOn(jwt, 'verify').mockReturnValue({
      type: 'mfa_pending',
      sub: 'admin@example.com',
    } as never);
    const { res, status } = createMockResponse();

    mfaVerify({ body: { tempToken: 'temp', code: '123456' } } as Request, res);

    expect(status).toHaveBeenCalledWith(503);
  });

  it('mfaVerify returns access token for valid OTP', () => {
    vi.spyOn(jwt, 'verify').mockReturnValue({
      type: 'mfa_pending',
      sub: 'admin@example.com',
    } as never);
    vi.mocked(otp.verifySync).mockReturnValue({ valid: true } as never);
    vi.spyOn(jwt, 'sign').mockReturnValue('access-token' as never);
    const { res, json } = createMockResponse();

    mfaVerify({ body: { tempToken: 'temp', code: '123456' } } as Request, res);

    expect(json).toHaveBeenCalledWith({
      accessToken: 'access-token',
      user: { email: 'admin@example.com', name: 'Admin' },
    });
  });

  it('me returns authenticated user snapshot', () => {
    const { res, json } = createMockResponse();

    me({ user: { email: 'admin@example.com' } } as unknown as Request, res);

    expect(json).toHaveBeenCalledWith({ email: 'admin@example.com', name: 'Admin' });
  });
});
