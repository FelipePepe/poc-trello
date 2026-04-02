import { Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mfa-verify',
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
      <h1>Verificación MFA</h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
        <mat-form-field appearance="outline">
          <mat-label>Código de 6 dígitos</mat-label>
          <input
            matInput
            inputmode="numeric"
            maxlength="6"
            formControlName="code"
            autocomplete="one-time-code"
          />
        </mat-form-field>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button mat-flat-button type="submit" [disabled]="loading() || form.invalid">
          @if (loading()) {
            <mat-spinner diameter="20" />
          } @else {
            Verificar
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
export class MfaVerifyComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  private readonly tempToken: string | null;

  constructor() {
    const state = this.location.getState() as { tempToken?: string };
    this.tempToken = state.tempToken ?? null;
  }

  ngOnInit(): void {
    if (!this.tempToken) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading() || !this.tempToken) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { code } = this.form.getRawValue();

    this.authService.mfaVerify(this.tempToken, code).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/boards']);
      },
      error: (error: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(error.error?.message ?? 'No se pudo verificar el código');
      },
    });
  }
}
