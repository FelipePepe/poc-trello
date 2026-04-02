import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const login = vi.fn();
  const navigate = vi.fn();

  beforeEach(async () => {
    login.mockReset();
    navigate.mockReset();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login,
          },
        },
        {
          provide: Router,
          useValue: {
            navigate,
          },
        },
      ],
    }).compileComponents();
  });

  it('navigates to boards on direct login success', () => {
    login.mockReturnValue(
      of({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { id: 'u1', email: 'ana@example.com', name: 'Ana' },
      }),
    );

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'ana@example.com', password: 'pass123' });
    component.onSubmit();

    expect(login).toHaveBeenCalledWith('ana@example.com', 'pass123');
    expect(navigate).toHaveBeenCalledWith(['/boards']);
  });

  it('navigates to MFA verification when backend requires MFA', () => {
    login.mockReturnValue(of({ mfaRequired: true, tempToken: 'temp-123' }));

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'ana@example.com', password: 'pass123' });
    component.onSubmit();

    expect(navigate).toHaveBeenCalledWith(['/mfa-verify'], {
      state: { tempToken: 'temp-123' },
    });
  });

  it('shows backend error when login fails', () => {
    login.mockReturnValue(throwError(() => ({ error: { message: 'Credenciales inválidas' } })));

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'ana@example.com', password: 'bad-pass' });
    component.onSubmit();

    expect(component.error()).toBe('Credenciales inválidas');
    expect(component.loading()).toBe(false);
  });
});
