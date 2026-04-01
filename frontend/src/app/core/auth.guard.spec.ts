import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('returns true when user is authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => true },
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

  it('returns login UrlTree when user is unauthenticated', () => {
    const expectedTree = { redirected: true };
    const createUrlTree = vi.fn().mockReturnValue(expectedTree);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => false },
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
