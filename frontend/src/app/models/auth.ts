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
  mfaRequired: boolean;
  tempToken?: string;
  requiresMfaSetup?: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
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
