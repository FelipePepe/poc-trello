import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController | undefined;
  const navigate = vi.fn();
  const storage = new Map<string, string>();

  beforeEach(() => {
    const localStorageMock: Storage = {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      key: (index: number) => Array.from(storage.keys())[index] ?? null,
      get length() {
        return storage.size;
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    });
    localStorage.clear();
    navigate.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: { navigate } },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock?.verify());

  it('loads current user from storage on startup', () => {
    storage.set('auth_user', JSON.stringify({ id: 'u1', email: 'a@a.com', name: 'Admin' }));

    let rehydratedService: AuthService | undefined;
    TestBed.runInInjectionContext(() => {
      rehydratedService = new AuthService();
    });

    expect(rehydratedService?.currentUser()).toEqual({
      id: 'u1',
      email: 'a@a.com',
      name: 'Admin',
    });
    expect(rehydratedService?.isAuthenticated()).toBe(true);
  });

  it('login stores full session when MFA is not required', () => {
    service.login('admin@example.com', 'admin123').subscribe();

    const req = httpMock!.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@example.com', password: 'admin123' });
    req.flush({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      user: { id: 'u1', email: 'admin@example.com', name: 'Admin' },
    });

    expect(service.getAccessToken()).toBe('access-1');
    expect(service.getRefreshToken()).toBe('refresh-1');
    expect(service.currentUser()).toEqual({ id: 'u1', email: 'admin@example.com', name: 'Admin' });
  });

  it('login does not store tokens when MFA is required', () => {
    service.login('admin@example.com', 'admin123').subscribe();

    const req = httpMock!.expectOne('/api/auth/login');
    req.flush({ mfaRequired: true, tempToken: 'temp-1' });

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('mfaVerify stores full session after successful verification', () => {
    service.mfaVerify('temp-1', '123456').subscribe();

    const req = httpMock!.expectOne('/api/auth/mfa/verify');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ tempToken: 'temp-1', code: '123456' });
    req.flush({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      user: { id: 'u2', email: 'mfa@example.com', name: 'MFA User' },
    });

    expect(service.getAccessToken()).toBe('access-2');
    expect(service.getRefreshToken()).toBe('refresh-2');
    expect(service.currentUser()).toEqual({ id: 'u2', email: 'mfa@example.com', name: 'MFA User' });
  });

  it('refresh stores new tokens and user', () => {
    service.refresh('old-refresh').subscribe();

    const req = httpMock!.expectOne('/api/auth/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'old-refresh' });
    req.flush({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
      user: { id: 'u3', email: 'refresh@example.com', name: 'Refresh User' },
    });

    expect(service.getAccessToken()).toBe('access-new');
    expect(service.getRefreshToken()).toBe('refresh-new');
    expect(service.currentUser()).toEqual({
      id: 'u3',
      email: 'refresh@example.com',
      name: 'Refresh User',
    });
  });

  it('logout clears session and navigates to login', () => {
    storage.set('auth_access_token', 'access-1');
    storage.set('auth_refresh_token', 'refresh-1');
    storage.set('auth_user', JSON.stringify({ id: 'u1', email: 'a@a.com', name: 'Admin' }));

    service = TestBed.inject(AuthService);
    service.logout().subscribe();

    const req = httpMock!.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok' });

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
