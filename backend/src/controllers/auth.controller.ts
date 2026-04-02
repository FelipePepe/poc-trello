import { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import type {
  LoginDto,
  MfaVerifyDto,
  ReconfigureMfaDto,
  JwtTempPayload,
  JwtAccessPayload,
  RefreshDto,
} from '../models/auth';
import { usersRepo } from '../db/repositories/users.repo';
import { authSessionsRepo } from '../db/repositories/auth-sessions.repo';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getCfg() {
  return {
    mfaSecret: process.env['MFA_SECRET'] ?? '',
    jwtSecret: process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
    jwtExpiry: process.env['JWT_EXPIRY'] ?? '24h',
    appName: 'Trello Clone',
  };
}

function makeSessionExpiresAt(): string {
  return new Date(Date.now() + SESSION_TTL_MS).toISOString();
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginDto;
  const cfg = getCfg();

  if (!email?.trim() || !password) {
    res.status(400).json({ message: 'Email y contraseña son requeridos' });
    return;
  }

  const user = await usersRepo.findByEmail(email);
  if (!user) {
    res.status(401).json({ message: 'Credenciales incorrectas' });
    return;
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    res.status(401).json({ message: 'Credenciales incorrectas' });
    return;
  }

  if (user.mfaEnabled) {
    const tempToken = jwt.sign(
      { sub: user.id, type: 'mfa_pending' } satisfies JwtTempPayload,
      cfg.jwtSecret,
      { expiresIn: '5m' },
    );
    res.json({ mfaRequired: true, tempToken, requiresMfaSetup: !user.mfaSecret });
    return;
  }

  // MFA disabled — issue session directly
  const refreshToken = uuidv4();
  const session = await authSessionsRepo.create({
    userId: user.id,
    tokenId: refreshToken,
    expiresAt: makeSessionExpiresAt(),
  });

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      sid: session.id,
      type: 'access',
    } satisfies JwtAccessPayload,
    cfg.jwtSecret,
    { expiresIn: cfg.jwtExpiry } as SignOptions,
  );

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
};

export const mfaSetup = async (req: Request, res: Response): Promise<void> => {
  const cfg = getCfg();

  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  let payload: JwtTempPayload;
  try {
    payload = jwt.verify(header.slice(7), cfg.jwtSecret) as JwtTempPayload;
    if (payload.type !== 'mfa_pending') throw new Error('wrong type');
  } catch {
    res.status(401).json({ message: 'Sesión inválida o expirada' });
    return;
  }

  // payload.sub is now userId
  const user = await usersRepo.findById(payload.sub);
  if (!user) {
    res.status(401).json({ message: 'Sesión inválida o expirada' });
    return;
  }

  const secret = user.mfaSecret || cfg.mfaSecret || process.env['_MFA_SESSION_SECRET'] || '';
  if (!secret) {
    res.status(503).json({ message: 'MFA_SECRET not configured on the server' });
    return;
  }

  const otpauthUrl = generateURI({ secret, label: user.email, issuer: cfg.appName });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  res.json({
    secret,
    otpauthUrl,
    qrDataUrl,
    manualEntry: `Cuenta: ${user.email}\nClave: ${secret}`,
  });
};

export const mfaVerify = async (req: Request, res: Response): Promise<void> => {
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

  // payload.sub is now userId
  const user = await usersRepo.findById(payload.sub);
  if (!user) {
    res.status(401).json({ message: 'Sesión inválida o expirada' });
    return;
  }

  const secret = user.mfaSecret || cfg.mfaSecret || process.env['_MFA_SESSION_SECRET'] || '';
  if (!secret) {
    res.status(503).json({ message: 'MFA no configurado. Contactá al administrador.' });
    return;
  }

  let isValid = false;
  try {
    const result = verifySync({ token: code, secret, epochTolerance: 60 });
    isValid = result.valid;
  } catch {
    isValid = false;
  }
  if (!isValid) {
    res
      .status(401)
      .json({ message: 'Código incorrecto o expirado. Introduce el código actual de tu app.' });
    return;
  }

  // If the user had no personal secret yet, persist the one they just verified against
  // so the QR setup screen won't appear again on future logins.
  if (!user.mfaSecret) {
    await usersRepo.updateMfaConfig(user.id, secret, true);
  }

  const refreshToken = uuidv4();
  const session = await authSessionsRepo.create({
    userId: user.id,
    tokenId: refreshToken,
    expiresAt: makeSessionExpiresAt(),
  });

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      sid: session.id,
      type: 'access',
    } satisfies JwtAccessPayload,
    cfg.jwtSecret,
    { expiresIn: cfg.jwtExpiry } as SignOptions,
  );

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
};

export const me = (req: Request, res: Response): void => {
  const user = req.user!;
  res.json({ id: user.id, email: user.email, name: user.name });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  await authSessionsRepo.revoke(req.user!.sessionId);
  res.json({ message: 'Sesión cerrada exitosamente' });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as RefreshDto;
  const cfg = getCfg();

  if (!refreshToken) {
    res.status(400).json({ message: 'refreshToken es requerido' });
    return;
  }

  const session = await authSessionsRepo.findByTokenId(refreshToken);
  if (!session) {
    res.status(401).json({ message: 'Token de refresco inválido' });
    return;
  }

  if (session.revokedAt) {
    res.status(401).json({ message: 'Sesión revocada' });
    return;
  }

  if (new Date(session.expiresAt) < new Date()) {
    res.status(401).json({ message: 'Sesión expirada' });
    return;
  }

  const user = await usersRepo.findById(session.userId);
  if (!user) {
    res.status(401).json({ message: 'Usuario no encontrado' });
    return;
  }

  const newRefreshToken = uuidv4();
  const newSession = await authSessionsRepo.rotate(session.id, {
    userId: user.id,
    tokenId: newRefreshToken,
    expiresAt: makeSessionExpiresAt(),
  });

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      sid: newSession.id,
      type: 'access',
    } satisfies JwtAccessPayload,
    cfg.jwtSecret,
    { expiresIn: cfg.jwtExpiry } as SignOptions,
  );

  res.json({
    accessToken,
    refreshToken: newRefreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
};

export const reconfigureMfa = async (req: Request, res: Response): Promise<void> => {
  const { currentCode } = req.body as ReconfigureMfaDto;
  const cfg = getCfg();

  if (!currentCode?.trim()) {
    res.status(400).json({ message: 'currentCode es requerido' });
    return;
  }

  const requesterId = req.user?.id;
  if (!requesterId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = await usersRepo.findById(requesterId);
  if (!user) {
    res.status(401).json({ message: 'Usuario no encontrado' });
    return;
  }

  const currentSecret = user.mfaSecret || cfg.mfaSecret || process.env['_MFA_SESSION_SECRET'] || '';
  if (!currentSecret) {
    res.status(503).json({ message: 'MFA no configurado. Contactá al administrador.' });
    return;
  }

  let isCurrentCodeValid = false;
  try {
    const result = verifySync({ token: currentCode, secret: currentSecret, epochTolerance: 60 });
    isCurrentCodeValid = result.valid;
  } catch {
    isCurrentCodeValid = false;
  }

  if (!isCurrentCodeValid) {
    res.status(401).json({ message: 'Código MFA inválido' });
    return;
  }

  const newSecret = generateSecret();
  await usersRepo.updateMfaConfig(user.id, newSecret, true);

  const otpauthUrl = generateURI({ secret: newSecret, label: user.email, issuer: cfg.appName });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  res.json({
    secret: newSecret,
    otpauthUrl,
    qrDataUrl,
    manualEntry: `Cuenta: ${user.email}\nClave: ${newSecret}`,
  });
};
