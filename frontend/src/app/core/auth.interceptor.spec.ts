import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('adds bearer token when access token exists and request has no Authorization header', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getAccessToken: () => 'abc-token',
            getRefreshToken: () => 'refresh-token',
            refresh: vi.fn(),
            onAuthenticationFailure: vi.fn(),
          },
        },
      ],
    });

    const req = new HttpRequest('GET', '/api/boards');
    const next = vi.fn((request: HttpRequest<unknown>) => of(new HttpResponse({ status: 200 })));

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const forwardedReq = next.mock.calls[0][0];
    expect(forwardedReq.headers.get('Authorization')).toBe('Bearer abc-token');
  });

  it('does not override existing Authorization header', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getAccessToken: () => 'abc-token',
            getRefreshToken: () => 'refresh-token',
            refresh: vi.fn(),
            onAuthenticationFailure: vi.fn(),
          },
        },
      ],
    });

    const req = new HttpRequest('GET', '/api/auth/mfa/setup', null, {
      headers: new HttpHeaders({ Authorization: 'Bearer temp-token' }),
    });
    const next = vi.fn((request: HttpRequest<unknown>) => of(new HttpResponse({ status: 200 })));

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const forwardedReq = next.mock.calls[0][0];
    expect(forwardedReq.headers.get('Authorization')).toBe('Bearer temp-token');
  });

  it('refreshes token and retries request after 401', async () => {
    const refresh = vi.fn().mockReturnValue(
      of({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: 'u1', email: 'ana@example.com', name: 'Ana' },
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getAccessToken: () => 'expired-access',
            getRefreshToken: () => 'refresh-token',
            refresh,
            onAuthenticationFailure: vi.fn(),
          },
        },
      ],
    });

    const req = new HttpRequest('GET', '/api/boards');
    let callCount = 0;

    const next = vi.fn((request: HttpRequest<unknown>) => {
      callCount += 1;

      if (callCount === 1) {
        expect(request.headers.get('Authorization')).toBe('Bearer expired-access');
        return throwError(() => new HttpErrorResponse({ status: 401 }));
      }

      expect(request.headers.get('Authorization')).toBe('Bearer new-access-token');
      return of(new HttpResponse({ status: 200, body: { ok: true } }));
    });

    const result$ = TestBed.runInInjectionContext(() => authInterceptor(req, next));
    const result = await firstValueFrom(result$);

    expect(result).toBeInstanceOf(HttpResponse);
    expect(refresh).toHaveBeenCalledWith('refresh-token');
    expect(callCount).toBe(2);
  });

  it('clears authentication state when refresh fails', async () => {
    const onAuthenticationFailure = vi.fn();
    const refresh = vi.fn().mockReturnValue(throwError(() => new Error('refresh failed')));

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getAccessToken: () => 'expired-access',
            getRefreshToken: () => 'refresh-token',
            refresh,
            onAuthenticationFailure,
          },
        },
      ],
    });

    const req = new HttpRequest('GET', '/api/boards');
    const next = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 401 })));

    const result$ = TestBed.runInInjectionContext(() => authInterceptor(req, next));

    await expect(firstValueFrom(result$)).rejects.toBeTruthy();
    expect(onAuthenticationFailure).toHaveBeenCalled();
  });

  it('does not trigger refresh when /api/auth/login returns 401', async () => {
    const refresh = vi.fn();
    const onAuthenticationFailure = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getAccessToken: () => 'expired-access',
            getRefreshToken: () => 'refresh-token',
            refresh,
            onAuthenticationFailure,
          },
        },
      ],
    });

    const req = new HttpRequest('POST', '/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123',
    });

    const next = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 401 })));

    const result$ = TestBed.runInInjectionContext(() => authInterceptor(req, next));

    await expect(firstValueFrom(result$)).rejects.toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
    expect(onAuthenticationFailure).not.toHaveBeenCalled();
  });

  it('does not trigger refresh when /api/auth/mfa/verify returns 401', async () => {
    const refresh = vi.fn();
    const onAuthenticationFailure = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getAccessToken: () => 'expired-access',
            getRefreshToken: () => 'refresh-token',
            refresh,
            onAuthenticationFailure,
          },
        },
      ],
    });

    const req = new HttpRequest('POST', '/api/auth/mfa/verify', {
      tempToken: 'temp-token',
      code: '123456',
    });

    const next = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 401 })));

    const result$ = TestBed.runInInjectionContext(() => authInterceptor(req, next));

    await expect(firstValueFrom(result$)).rejects.toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
    expect(onAuthenticationFailure).not.toHaveBeenCalled();
  });
});
