import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHeaders, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('adds bearer token when auth token exists and request has no Authorization', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { token: () => 'abc-token' } }],
    });

    const req = new HttpRequest('GET', '/api/boards');
    const next = vi.fn((request: HttpRequest<unknown>) => {
      void request;
      return of(new HttpResponse({ status: 200 }));
    });

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const forwardedReq = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwardedReq.headers.get('Authorization')).toBe('Bearer abc-token');
  });

  it('does not override existing Authorization header', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { token: () => 'abc-token' } }],
    });

    const req = new HttpRequest('GET', '/api/auth/mfa/setup', null, {
      headers: new HttpHeaders({ Authorization: 'Bearer temp-token' }),
    });
    const next = vi.fn((request: HttpRequest<unknown>) => {
      void request;
      return of(new HttpResponse({ status: 200 }));
    });

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const forwardedReq = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwardedReq.headers.get('Authorization')).toBe('Bearer temp-token');
  });
});
