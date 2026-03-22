import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import type {
  AuthUser,
  LoginDto,
  MfaVerifyDto,
  LoginResponse,
  AuthResponse,
  MfaSetupResponse,
} from '../models/auth';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _user = signal<AuthUser | null>(
    JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as AuthUser | null
  );

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  login(dto: LoginDto) {
    return this.http.post<LoginResponse>('/api/auth/login', dto);
  }

  verifyMfa(dto: MfaVerifyDto) {
    return this.http.post<AuthResponse>('/api/auth/mfa/verify', dto);
  }

  getMfaSetup(tempToken: string) {
    return this.http.get<MfaSetupResponse>('/api/auth/mfa/setup', {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
  }

  setSession(accessToken: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(accessToken);
    this._user.set(user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }
}
