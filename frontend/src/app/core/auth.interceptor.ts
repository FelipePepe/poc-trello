import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, finalize, map, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const REFRESH_ENDPOINT = '/api/auth/refresh';
const AUTH_PUBLIC_ENDPOINTS = ['/api/auth/login', '/api/auth/mfa/verify', '/api/auth/mfa/setup'];

let refreshRequest$: Observable<string> | null = null;

const withAuthorization = (req: Parameters<HttpInterceptorFn>[0], token: string) => {
  if (req.headers.has('Authorization')) {
    return req;
  }

  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();
  const requestWithAuth = accessToken ? withAuthorization(req, accessToken) : req;

  return next(requestWithAuth).pipe(
    catchError((error) => {
      const isPublicAuthEndpoint = AUTH_PUBLIC_ENDPOINTS.some((endpoint) =>
        req.url.includes(endpoint),
      );

      if (error.status !== 401 || req.url.includes(REFRESH_ENDPOINT) || isPublicAuthEndpoint) {
        return throwError(() => error);
      }

      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) {
        authService.onAuthenticationFailure();
        return throwError(() => error);
      }

      refreshRequest$ ??= authService.refresh(refreshToken).pipe(
        map((response) => response.accessToken),
        shareReplay(1),
        finalize(() => {
          refreshRequest$ = null;
        }),
      );

      return refreshRequest$.pipe(
        switchMap((newAccessToken) => next(withAuthorization(req, newAccessToken))),
        catchError((refreshError) => {
          authService.onAuthenticationFailure();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
