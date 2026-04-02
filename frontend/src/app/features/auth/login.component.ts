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
    <section class="login-page">
      <div class="ambient ambient-left"></div>
      <div class="ambient ambient-right"></div>

      <article class="login-card">
        <p class="eyebrow">Trello Clone</p>
        <h1>Iniciar sesión</h1>
        <p class="subtitle">Accede a tus tableros con autenticación segura y verificación MFA.</p>

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
      </article>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        color: #efeaff;
        font-family: 'Space Grotesk', 'IBM Plex Sans', 'Avenir Next', 'Segoe UI', sans-serif;
      }

      .login-page {
        --card-border: rgba(166, 151, 214, 0.38);
        --card-bg: rgba(17, 10, 45, 0.72);
        --body-copy: #bfb6dd;
        --input-bg: rgba(59, 51, 98, 0.45);
        --accent: #80ffd3;

        position: relative;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 24px;
        overflow: hidden;
        background:
          radial-gradient(1200px 600px at 12% 8%, #22115f 0%, transparent 65%),
          radial-gradient(850px 500px at 92% 94%, #0b2f67 0%, transparent 65%),
          linear-gradient(140deg, #07021f 0%, #13023f 54%, #03143d 100%);
      }

      .ambient {
        position: absolute;
        border-radius: 999px;
        pointer-events: none;
        filter: blur(8px);
        opacity: 0.55;
      }

      .ambient-left {
        width: 280px;
        height: 280px;
        top: 9%;
        left: -60px;
        background: radial-gradient(circle at 35% 35%, #6debd2 0%, #2e4b88 65%, transparent 100%);
      }

      .ambient-right {
        width: 320px;
        height: 320px;
        right: -90px;
        bottom: -30px;
        background: radial-gradient(circle at 35% 35%, #a485ff 0%, #17328d 60%, transparent 100%);
      }

      .login-card {
        width: min(100%, 480px);
        padding: 28px;
        border-radius: 20px;
        border: 1px solid var(--card-border);
        background: var(--card-bg);
        backdrop-filter: blur(14px);
        box-shadow:
          0 18px 38px rgba(3, 4, 23, 0.45),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
      }

      .eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        font-size: 11px;
        color: var(--accent);
        font-weight: 700;
      }

      h1 {
        margin: 10px 0 6px;
        font-size: clamp(34px, 6vw, 42px);
        line-height: 1;
        letter-spacing: -0.03em;
        font-weight: 700;
      }

      .subtitle {
        margin: 0 0 18px;
        color: var(--body-copy);
        font-size: 14px;
        line-height: 1.45;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      mat-form-field {
        --mdc-outlined-text-field-container-shape: 12px;
      }

      :host ::ng-deep .mdc-text-field--outlined {
        background: var(--input-bg);
      }

      .error {
        color: #ff908a;
        margin: 0;
        font-size: 13px;
      }

      button[mat-flat-button] {
        height: 46px;
        margin-top: 6px;
        border-radius: 999px;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: #1a0c44;
        background: linear-gradient(90deg, #8bffde 0%, #a9d9ff 45%, #d6c6ff 100%);
      }

      @media (max-width: 640px) {
        .login-card {
          padding: 22px;
          border-radius: 16px;
        }

        h1 {
          font-size: 34px;
        }
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
            state: {
              tempToken: response.tempToken,
              requiresMfaSetup: response.requiresMfaSetup ?? false,
            },
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
