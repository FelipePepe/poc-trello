import { Component, inject, signal, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Board, CreateCustomFieldDto, CustomField, CustomFieldType } from '../../../models';
import { CustomFieldsService } from '../../../services/custom-fields.service';

@Component({
  selector: 'app-board-settings-dialog',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSlideToggleModule,
  ],
  templateUrl: './board-settings-dialog.component.html',
  styleUrl: './board-settings-dialog.component.scss',
})
export class BoardSettingsDialogComponent implements OnInit {
  private readonly customFieldsService = inject(CustomFieldsService);
  private readonly snackBar = inject(MatSnackBar);
  data = inject<{ board: Board }>(MAT_DIALOG_DATA);

  fields = signal<CustomField[]>([]);
  loading = signal(true);
  addingField = signal(false);

  newFieldName = signal('');
  newFieldType = signal<CustomFieldType>('text');
  newFieldOptions = signal('');
  newFieldShowOnCard = signal(false);

  readonly fieldTypes: { value: CustomFieldType; label: string }[] = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'checkbox', label: 'Casilla' },
    { value: 'date', label: 'Fecha' },
    { value: 'select', label: 'Selección' },
  ];

  ngOnInit(): void {
    this.customFieldsService.getByBoard(this.data.board.id).subscribe({
      next: (fields) => {
        this.fields.set(fields);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar campos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  getTypeLabel(type: CustomFieldType): string {
    return this.fieldTypes.find((t) => t.value === type)?.label ?? type;
  }

  addField(): void {
    const name = this.newFieldName().trim();
    if (!name) return;

    const dto: CreateCustomFieldDto = {
      name,
      type: this.newFieldType(),
      position: this.fields().length,
      showOnCard: this.newFieldShowOnCard(),
    };

    if (this.newFieldType() === 'select' && this.newFieldOptions().trim()) {
      dto.options = this.newFieldOptions()
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    }

    this.customFieldsService.create(this.data.board.id, dto).subscribe({
      next: (field) => {
        this.fields.update((prev) => [...prev, field]);
        this.newFieldName.set('');
        this.newFieldType.set('text');
        this.newFieldOptions.set('');
        this.newFieldShowOnCard.set(false);
        this.addingField.set(false);
      },
      error: () => this.snackBar.open('Error al crear campo', 'Cerrar', { duration: 3000 }),
    });
  }

  deleteField(field: CustomField): void {
    if (!confirm(`¿Eliminar el campo "${field.name}"?`)) return;
    this.customFieldsService.delete(field.id).subscribe({
      next: () => this.fields.update((prev) => prev.filter((f) => f.id !== field.id)),
      error: () => this.snackBar.open('Error al eliminar campo', 'Cerrar', { duration: 3000 }),
    });
  }
}
