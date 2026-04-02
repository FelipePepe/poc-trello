import { TestBed } from '@angular/core/testing';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('returns true when current user is already in memory', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({ id: 'u1', email: 'a@a.com', name: 'Admin' }),
            getAccessToken: () => 'access',
            getMe: vi.fn(),
          },
        },
        {
          provide: Router,
          useValue: { createUrlTree: vi.fn() },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('returns true after fetching /me when token exists but user is not loaded', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser: () => null,
            getAccessToken: () => 'access-token',
            getMe: () => of({ id: 'u1', email: 'a@a.com', name: 'Admin' }),
          },
        },
        {
          provide: Router,
          useValue: { createUrlTree: vi.fn() },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    if (isObservable(result)) {
      expect(await firstValueFrom(result)).toBe(true);
      return;
    }

    expect(result).toBe(true);
  });

  it('returns login UrlTree when /me fails', async () => {
    const expectedTree = { redirected: true };
    const createUrlTree = vi.fn().mockReturnValue(expectedTree);
    const onAuthenticationFailure = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser: () => null,
            getAccessToken: () => 'access-token',
            getMe: () => throwError(() => new Error('unauthorized')),
            onAuthenticationFailure,
          },
        },
        {
          provide: Router,
          useValue: { createUrlTree },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    if (isObservable(result)) {
      expect(await firstValueFrom(result)).toEqual(expectedTree);
    } else {
      expect(result).toEqual(expectedTree);
    }
    expect(onAuthenticationFailure).toHaveBeenCalled();
    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('returns login UrlTree when there is no access token', () => {
    const expectedTree = { redirected: true };
    const createUrlTree = vi.fn().mockReturnValue(expectedTree);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser: () => null,
            getAccessToken: () => null,
            getMe: vi.fn(),
          },
        },
        {
          provide: Router,
          useValue: { createUrlTree },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toEqual(expectedTree);
  });
});
