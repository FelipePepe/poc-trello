export interface AuthUser {
  email: string;
  name: string;
}

export interface AuthenticatedUser extends AuthUser {
  id: string;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAuthUser extends AuthenticatedUser {
  passwordHash: string;
  mfaSecret: string | null;
}

export interface AuthSession {
  id: string;
  userId: string;
  tokenId: string;
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateAuthSessionDto = Pick<AuthSession, 'userId' | 'tokenId' | 'expiresAt'> & {
  lastUsedAt?: string | null;
};

export interface LoginDto {
  email: string;
  password: string;
}

export interface MfaVerifyDto {
  tempToken: string;
  code: string;
}

export interface ReconfigureMfaDto {
  currentCode: string;
}

export interface LoginResponse {
  mfaRequired: true;
  tempToken: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface MfaSetupResponse {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
  manualEntry: string;
}

export interface JwtTempPayload {
  sub: string; // userId
  type: 'mfa_pending';
}

export interface JwtAccessPayload {
  sub: string; // userId
  email: string;
  name: string;
  sid: string; // sessionId
  type: 'access';
}

export interface RefreshDto {
  refreshToken: string;
}
