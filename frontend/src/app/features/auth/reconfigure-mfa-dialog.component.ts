import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reconfigure-mfa-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-shell">
      <h2 mat-dialog-title>Reconfigurar MFA</h2>

      <div mat-dialog-content class="dialog-content">
        <p class="helper">
          Para generar un nuevo QR de MFA necesitamos validar tu codigo actual de 6 digitos.
        </p>

        @if (!result()) {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mfa-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Codigo actual</mat-label>
              <input matInput inputmode="numeric" maxlength="6" formControlName="currentCode" />
            </mat-form-field>

            @if (error()) {
              <p class="error">{{ error() }}</p>
            }

            <div class="actions">
              <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
              <button mat-flat-button type="submit" [disabled]="loading() || form.invalid">
                @if (loading()) {
                  <mat-spinner diameter="18" />
                } @else {
                  Generar nuevo QR
                }
              </button>
            </div>
          </form>
        } @else {
          <div class="result">
            <p class="helper">
              Escanea este nuevo QR en tu app autenticadora. El secreto anterior queda reemplazado.
            </p>

            <img class="qr" [src]="result()!.qrDataUrl" alt="Nuevo codigo QR MFA" />

            <div class="secret-box">
              <mat-icon>key</mat-icon>
              <code>{{ result()!.secret }}</code>
            </div>

            <div class="actions">
              <button mat-flat-button type="button" (click)="dialogRef.close(true)">Listo</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-shell {
        min-width: min(520px, 92vw);
      }

      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .helper {
        margin: 0;
        color: rgba(255, 255, 255, 0.74);
        font-size: 0.9rem;
      }

      .full-width {
        width: 100%;
      }

      .mfa-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .error {
        margin: 0;
        color: #ff908a;
        font-size: 0.85rem;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .result {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
      }

      .qr {
        width: 220px;
        height: 220px;
        border-radius: 12px;
        background: #fff;
        padding: 8px;
      }

      .secret-box {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 10px;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.03);
      }

      .secret-box code {
        overflow-wrap: anywhere;
      }
    `,
  ],
})
export class ReconfigureMfaDialogComponent {
  private readonly authService = inject(AuthService);
  readonly dialogRef = inject(MatDialogRef<ReconfigureMfaDialogComponent, boolean>);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<{ secret: string; qrDataUrl: string } | null>(null);

  readonly form = this.fb.nonNullable.group({
    currentCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { currentCode } = this.form.getRawValue();

    this.authService.reconfigureMfa(currentCode).subscribe({
      next: (payload) => {
        this.loading.set(false);
        this.result.set({ secret: payload.secret, qrDataUrl: payload.qrDataUrl });
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'No se pudo reconfigurar MFA');
      },
    });
  }
}
