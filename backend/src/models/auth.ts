export interface AuthUser {
  email: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface MfaVerifyDto {
  tempToken: string;
  code: string;
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
  sub: string;
  type: 'mfa_pending';
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  type: 'access';
}
