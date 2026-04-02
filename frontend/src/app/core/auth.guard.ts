import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()) {
    return true;
  }

  if (!authService.getAccessToken()) {
    return router.createUrlTree(['/login']);
  }

  return authService.getMe().pipe(
    map(() => true),
    catchError(() => {
      authService.onAuthenticationFailure();
      return of(router.createUrlTree(['/login']));
    }),
  );
};
