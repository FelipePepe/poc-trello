import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../services/auth.service';
import type { MfaSetupResponse } from '../../../models/auth';

type Step = 'password' | 'mfa-setup' | 'mfa-verify';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  step = signal<Step>('password');
  loading = signal(false);
  error = signal<string | null>(null);
  hidePassword = signal(true);
  tempToken = signal<string | null>(null);
  setupData = signal<MfaSetupResponse | null>(null);
  showSetup = signal(false);

  passwordForm = this.fb.group({
    email: ['admin@example.com', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  mfaForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.passwordForm.value as { email: string; password: string };

    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.tempToken.set(res.tempToken);
        this.step.set('mfa-verify');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al iniciar sesión');
      },
    });
  }

  loadSetupQr(): void {
    const token = this.tempToken();
    if (!token || this.setupData()) { this.showSetup.set(true); return; }

    this.loading.set(true);
    this.authService.getMfaSetup(token).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.setupData.set(data);
        this.showSetup.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'No se pudo cargar el QR de configuración');
      },
    });
  }

  onMfaSubmit(): void {
    if (this.mfaForm.invalid) return;
    const token = this.tempToken();
    if (!token) return;

    this.loading.set(true);
    this.error.set(null);

    const { code } = this.mfaForm.value as { code: string };

    this.authService.verifyMfa({ tempToken: token, code }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.authService.setSession(res.accessToken, res.user);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Código MFA inválido');
        this.mfaForm.reset();
      },
    });
  }

  goBack(): void {
    this.step.set('password');
    this.tempToken.set(null);
    this.setupData.set(null);
    this.showSetup.set(false);
    this.error.set(null);
    this.mfaForm.reset();
  }
}
