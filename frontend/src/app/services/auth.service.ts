import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import type { AuthenticatedUser, LoginResponse, MfaSetupResponse } from '../models';
import { environment } from '../../environments/environment';

const STORAGE_KEYS = {
  accessToken: 'auth_access_token',
  refreshToken: 'auth_refresh_token',
  user: 'auth_user',
} as const;

type AuthSessionResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
};

type LogoutResponse = {
  message: string;
};

type MfaProvisioningResponse = {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
  manualEntry: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = environment.apiUrl;

  currentUser = signal<AuthenticatedUser | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    this.loadFromStorage();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/api/auth/login`, { email, password }).pipe(
      tap((response) => {
        if (response.mfaRequired) {
          return;
        }

        if (response.accessToken && response.refreshToken && response.user) {
          this.storeSession(response.accessToken, response.refreshToken, response.user);
        }
      }),
    );
  }

  mfaSetup(tempToken: string): Observable<MfaSetupResponse> {
    return this.http.get<MfaSetupResponse>(`${this.api}/api/auth/mfa/setup`, {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
  }

  mfaVerify(tempToken: string, code: string): Observable<AuthSessionResponse> {
    return this.http
      .post<AuthSessionResponse>(`${this.api}/api/auth/mfa/verify`, { tempToken, code })
      .pipe(
        tap((response) =>
          this.storeSession(response.accessToken, response.refreshToken, response.user),
        ),
      );
  }

  getMe(): Observable<AuthenticatedUser> {
    return this.http
      .get<AuthenticatedUser>(`${this.api}/api/auth/me`)
      .pipe(tap((user) => this.storeUser(user)));
  }

  refresh(refreshToken: string): Observable<AuthSessionResponse> {
    return this.http
      .post<AuthSessionResponse>(`${this.api}/api/auth/refresh`, { refreshToken })
      .pipe(
        tap((response) =>
          this.storeSession(response.accessToken, response.refreshToken, response.user),
        ),
      );
  }

  reconfigureMfa(currentCode: string): Observable<MfaProvisioningResponse> {
    return this.http.post<MfaProvisioningResponse>(`${this.api}/api/auth/mfa/reconfigure`, {
      currentCode,
    });
  }

  logout(): Observable<LogoutResponse> {
    const token = this.getAccessToken();

    if (!token) {
      this.clearSession(true);
      return of({ message: 'No active session' });
    }

    return this.http.post<LogoutResponse>(`${this.api}/api/auth/logout`, {}).pipe(
      tap(() => this.clearSession(true)),
      catchError((error) => {
        this.clearSession(true);
        return throwError(() => error);
      }),
    );
  }

  onAuthenticationFailure(): void {
    this.clearSession(true);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.refreshToken);
  }

  private storeSession(accessToken: string, refreshToken: string, user: AuthenticatedUser): void {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    this.storeUser(user);
  }

  private storeUser(user: AuthenticatedUser): void {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadFromStorage(): void {
    const storedUser = localStorage.getItem(STORAGE_KEYS.user);
    if (!storedUser) {
      return;
    }

    try {
      this.currentUser.set(JSON.parse(storedUser) as AuthenticatedUser);
    } catch {
      this.clearSession();
    }
  }

  private clearSession(redirectToLogin = false): void {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    this.currentUser.set(null);

    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }
}
