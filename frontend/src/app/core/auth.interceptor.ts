import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  // Skip adding token if request already has Authorization (e.g., MFA setup call with tempToken)
  if (token && !req.headers.has('Authorization')) {
    return next(
      req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    );
  }

  return next(req);
};
