import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { v4 as uuidv4 } from 'uuid';

import { CardsService } from '../../../services/cards.service';
import { CustomFieldsService } from '../../../services/custom-fields.service';
import { BoardList, Card, CardFieldValue, CustomField, Label, LABEL_PRESETS } from '../../../models';

@Component({
  selector: 'app-card-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './card-detail-dialog.component.html',
  styleUrl: './card-detail-dialog.component.scss',
})
export class CardDetailDialogComponent implements OnInit {
  private readonly cardsService = inject(CardsService);
  private readonly customFieldsService = inject(CustomFieldsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<CardDetailDialogComponent>);
  data = inject<{ card: Card; lists: BoardList[] }>(MAT_DIALOG_DATA);

  labelPresets = LABEL_PRESETS;

  title = signal('');
  description = signal('');
  dueDate = signal<Date | null>(null);
  selectedListId = signal('');
  labels = signal<Label[]>([]);
  editingTitle = signal(false);
  saving = signal(false);
  boardFields = signal<CustomField[]>([]);
  fieldValues = signal<Map<string, string | null>>(new Map());

  ngOnInit(): void {
    const { card } = this.data;
    this.title.set(card.title);
    this.description.set(card.description ?? '');
    this.dueDate.set(card.dueDate ? new Date(card.dueDate) : null);
    this.selectedListId.set(card.listId);
    this.labels.set([...card.labels]);

    // Populate field values from embedded data
    if (card.customFieldValues?.length) {
      const map = new Map<string, string | null>();
      card.customFieldValues.forEach((v: CardFieldValue) => map.set(v.fieldId, v.value));
      this.fieldValues.set(map);
    }

    // Load board's field definitions
    this.customFieldsService.getByBoard(card.boardId).subscribe({
      next: (fields) => this.boardFields.set(fields),
      error: () => this.snackBar.open('Error al cargar campos', 'Cerrar', { duration: 3000 }),
    });
  }

  updateFieldValue(fieldId: string, value: string | null): void {
    const cardId = this.data.card.id;
    if (value == null || value === '') {
      this.customFieldsService.deleteValue(cardId, fieldId).subscribe({
        next: () =>
          this.fieldValues.update((prev) => {
            const next = new Map(prev);
            next.delete(fieldId);
            return next;
          }),
        error: () => this.snackBar.open('Error al eliminar valor', 'Cerrar', { duration: 3000 }),
      });
    } else {
      this.customFieldsService.upsertValue(cardId, fieldId, { value }).subscribe({
        next: () =>
          this.fieldValues.update((prev) => {
            const next = new Map(prev);
            next.set(fieldId, value);
            return next;
          }),
        error: () => this.snackBar.open('Error al guardar valor', 'Cerrar', { duration: 3000 }),
      });
    }
  }

  get currentListName(): string {
    return this.data.lists.find((l) => l.id === this.selectedListId())?.title ?? '';
  }

  startEditTitle(): void {
    this.editingTitle.set(true);
    setTimeout(() => document.getElementById('card-title-input')?.focus(), 50);
  }

  isLabelSelected(preset: Omit<Label, 'id'>): boolean {
    return this.labels().some((l) => l.name === preset.name);
  }

  toggleLabel(preset: Omit<Label, 'id'>): void {
    if (this.isLabelSelected(preset)) {
      this.labels.update((prev) => prev.filter((l) => l.name !== preset.name));
    } else {
      this.labels.update((prev) => [
        ...prev,
        { id: uuidv4(), name: preset.name, color: preset.color },
      ]);
    }
  }

  save(): void {
    const title = this.title().trim();
    if (!title) return;

    this.saving.set(true);
    const listChanged = this.selectedListId() !== this.data.card.listId;

    this.cardsService
      .update(this.data.card.id, {
        title,
        description: this.description(),
        dueDate: this.dueDate() ? this.dueDate()!.toISOString() : null,
        labels: this.labels(),
        ...(listChanged && { listId: this.selectedListId() }),
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.dialogRef.close({ updated });
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
        },
      });
  }

  deleteCard(): void {
    if (!confirm('¿Eliminar esta tarjeta?')) return;
    this.cardsService.delete(this.data.card.id).subscribe({
      next: () => this.dialogRef.close({ deleted: true }),
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 }),
    });
  }
}
