import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { MfaVerifyComponent } from './mfa-verify.component';

describe('MfaVerifyComponent', () => {
  const mfaVerify = vi.fn();
  const navigate = vi.fn();
  const getState = vi.fn();

  beforeEach(async () => {
    mfaVerify.mockReset();
    navigate.mockReset();
    getState.mockReset();
    getState.mockReturnValue({ tempToken: 'temp-123' });

    await TestBed.configureTestingModule({
      imports: [MfaVerifyComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            mfaVerify,
          },
        },
        {
          provide: Router,
          useValue: {
            navigate,
          },
        },
        {
          provide: Location,
          useValue: {
            getState,
          },
        },
      ],
    }).compileComponents();
  });

  it('redirects to login when tempToken is missing', async () => {
    getState.mockReturnValue({});

    const fixture = TestBed.createComponent(MfaVerifyComponent);
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('verifies MFA code and navigates to boards', () => {
    mfaVerify.mockReturnValue(
      of({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        user: { id: 'u1', email: 'ana@example.com', name: 'Ana' },
      }),
    );

    const fixture = TestBed.createComponent(MfaVerifyComponent);
    const component = fixture.componentInstance;

    component.form.setValue({ code: '123456' });
    component.onSubmit();

    expect(mfaVerify).toHaveBeenCalledWith('temp-123', '123456');
    expect(navigate).toHaveBeenCalledWith(['/boards']);
  });

  it('shows backend error when MFA verification fails', () => {
    mfaVerify.mockReturnValue(throwError(() => ({ error: { message: 'Código inválido' } })));

    const fixture = TestBed.createComponent(MfaVerifyComponent);
    const component = fixture.componentInstance;

    component.form.setValue({ code: '123456' });
    component.onSubmit();

    expect(component.error()).toBe('Código inválido');
    expect(component.loading()).toBe(false);
  });
});
