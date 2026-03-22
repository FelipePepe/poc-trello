import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { BOARD_BACKGROUNDS } from '../../../models';

@Component({
  selector: 'app-create-board-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>dashboard</mat-icon>
      Nuevo tablero
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="create-form">
        <div class="bg-preview" [style.background]="selectedBg()">
          <span class="bg-text">{{ form.get('title')?.value || 'Título del tablero' }}</span>
        </div>

        <div class="bg-picker">
          <p class="bg-label">Color de fondo</p>
          <div class="bg-colors">
            @for (color of backgrounds; track color) {
              <button
                type="button"
                class="bg-swatch"
                [style.background]="color"
                [class.selected]="selectedBg() === color"
                (click)="selectedBg.set(color)"
              >
                @if (selectedBg() === color) {
                  <mat-icon>check</mat-icon>
                }
              </button>
            }
          </div>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Título *</mat-label>
          <input matInput formControlName="title" placeholder="Ej: Sprint 23" />
          @if (form.get('title')?.hasError('required') && form.get('title')?.touched) {
            <mat-error>El título es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción (opcional)</mat-label>
          <textarea matInput formControlName="description" rows="2" placeholder="¿De qué trata este tablero?"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="form.invalid"
        (click)="submit()"
      >
        Crear tablero
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.125rem;
      font-weight: 600;
      color: #172b4d;
    }
    .create-form { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
    .bg-preview {
      border-radius: 8px;
      height: 80px;
      display: flex;
      align-items: flex-end;
      padding: 12px;
      .bg-text { color: white; font-weight: 700; font-size: 1rem; text-shadow: 0 1px 3px rgba(0,0,0,.4); }
    }
    .bg-label { font-size: 0.8125rem; font-weight: 600; color: #5e6c84; margin: 0 0 8px; }
    .bg-colors { display: flex; flex-wrap: wrap; gap: 8px; }
    .bg-swatch {
      width: 36px; height: 36px; border-radius: 6px; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: transform .1s; position: relative;
      mat-icon { font-size: 18px; color: white; }
      &.selected { outline: 3px solid #172b4d; outline-offset: 2px; }
      &:hover { transform: scale(1.1); }
    }
    .full-width { width: 100%; }
  `],
})
export class CreateBoardDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateBoardDialogComponent>);
  private readonly fb = inject(FormBuilder);


  backgrounds = BOARD_BACKGROUNDS;
  selectedBg = signal(BOARD_BACKGROUNDS[0]);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close({
      title: this.form.value.title,
      description: this.form.value.description ?? '',
      background: this.selectedBg(),
    });
  }
}
