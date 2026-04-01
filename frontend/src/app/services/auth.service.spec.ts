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

  it('setSession updates signals and localStorage', () => {
    service.setSession('token-1', { email: 'a@a.com', name: 'Admin' });

    expect(service.token()).toBe('token-1');
    expect(service.user()).toEqual({ email: 'a@a.com', name: 'Admin' });
    expect(service.isAuthenticated()).toBe(true);
  });

  it('logout clears session and navigates to login', () => {
    service.setSession('token-1', { email: 'a@a.com', name: 'Admin' });

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('getMfaSetup adds Authorization header', () => {
    service.getMfaSetup('temp-token').subscribe();

    const req = httpMock!.expectOne('/api/auth/mfa/setup');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer temp-token');
    req.flush({ secret: 'x', otpauthUrl: 'y', qrDataUrl: 'z', manualEntry: 'w' });
  });

  it('login posts credentials to auth endpoint', () => {
    service.login({ email: 'admin@example.com', password: 'admin123' }).subscribe();

    const req = httpMock!.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ mfaRequired: true, tempToken: 'temp' });
  });

  it('verifyMfa posts token and code', () => {
    service.verifyMfa({ tempToken: 'temp', code: '123456' }).subscribe();

    const req = httpMock!.expectOne('/api/auth/mfa/verify');
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: 'token', user: { email: 'admin@example.com', name: 'Admin' } });
  });
});
