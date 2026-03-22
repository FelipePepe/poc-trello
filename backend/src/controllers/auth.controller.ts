import { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import type {
  LoginDto,
  MfaVerifyDto,
  JwtTempPayload,
} from '../models/auth';

function getCfg() {
  return {
    adminEmail: process.env['ADMIN_EMAIL'] ?? 'admin@example.com',
    adminPassword: process.env['ADMIN_PASSWORD'] ?? 'admin123',
    mfaSecret: process.env['MFA_SECRET'] ?? '',
    jwtSecret: process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
    jwtExpiry: process.env['JWT_EXPIRY'] ?? '24h',
    appName: 'Trello Clone',
  };
}

export const login = (req: Request, res: Response): void => {
  const { email, password } = req.body as LoginDto;
  const cfg = getCfg();

  if (!email?.trim() || !password) {
    res.status(400).json({ message: 'Email y contraseña son requeridos' });
    return;
  }

  if (email !== cfg.adminEmail || password !== cfg.adminPassword) {
    res.status(401).json({ message: 'Credenciales incorrectas' });
    return;
  }

  const tempToken = jwt.sign(
    { sub: email, type: 'mfa_pending' },
    cfg.jwtSecret,
    { expiresIn: '5m' }
  );

  res.json({ mfaRequired: true, tempToken });
};

export const mfaSetup = async (req: Request, res: Response): Promise<void> => {
  const cfg = getCfg();

  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), cfg.jwtSecret) as JwtTempPayload;
    if (payload.type !== 'mfa_pending') throw new Error('wrong type');
  } catch {
    res.status(401).json({ message: 'Sesión inválida o expirada' });
    return;
  }

  const secret = cfg.mfaSecret || process.env['_MFA_SESSION_SECRET'] || '';
  if (!secret) {
    res.status(503).json({ message: 'MFA_SECRET not configured on the server' });
    return;
  }

  const otpauthUrl = generateURI({ secret, label: cfg.adminEmail, issuer: cfg.appName });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  res.json({
    secret,
    otpauthUrl,
    qrDataUrl,
    manualEntry: `Cuenta: ${cfg.adminEmail}\nClave: ${secret}`,
  });
};

export const mfaVerify = (req: Request, res: Response): void => {
  const { tempToken, code } = req.body as MfaVerifyDto;
  const cfg = getCfg();

  if (!tempToken || !code) {
    res.status(400).json({ message: 'tempToken y code son requeridos' });
    return;
  }

  let payload: JwtTempPayload;
  try {
    payload = jwt.verify(tempToken, cfg.jwtSecret) as JwtTempPayload;
    if (payload.type !== 'mfa_pending') throw new Error('wrong type');
  } catch {
    res.status(401).json({ message: 'Sesión inválida o expirada' });
    return;
  }

  const secret = cfg.mfaSecret || process.env['_MFA_SESSION_SECRET'] || '';
  if (!secret) {
    res.status(503).json({ message: 'MFA no configurado. Contactá al administrador.' });
    return;
  }

  let isValid = false;
  try {
    const result = verifySync({ token: code, secret, epochTolerance: 30 });
    isValid = result.valid;
  } catch {
    isValid = false;
  }
  if (!isValid) {
    res.status(401).json({ message: 'Código MFA inválido' });
    return;
  }

  const accessToken = jwt.sign(
    { sub: payload.sub, email: payload.sub, type: 'access' },
    cfg.jwtSecret,
    { expiresIn: cfg.jwtExpiry } as SignOptions
  );

  res.json({
    accessToken,
    user: { email: cfg.adminEmail, name: 'Admin' },
  });
};

export const me = (req: Request, res: Response): void => {
  res.json({ email: req.user?.email, name: 'Admin' });
};
