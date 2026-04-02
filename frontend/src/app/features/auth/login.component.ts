import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <section class="auth-shell">
      <h1>Iniciar sesión</h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Contraseña</mat-label>
          <input
            matInput
            type="password"
            formControlName="password"
            autocomplete="current-password"
          />
        </mat-form-field>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button mat-flat-button type="submit" [disabled]="loading() || form.invalid">
          @if (loading()) {
            <mat-spinner diameter="20" />
          } @else {
            Entrar
          }
        </button>
      </form>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      .auth-shell {
        max-width: 440px;
        margin: 56px auto;
        padding: 24px;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .error {
        color: #b3261e;
        margin: 0;
      }

      button[mat-flat-button] {
        height: 44px;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.loading.set(false);

        if (response.mfaRequired && response.tempToken) {
          this.router.navigate(['/mfa-verify'], {
            state: { tempToken: response.tempToken },
          });
          return;
        }

        this.router.navigate(['/boards']);
      },
      error: (error: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(error.error?.message ?? 'No se pudo iniciar sesión');
      },
    });
  }
}
