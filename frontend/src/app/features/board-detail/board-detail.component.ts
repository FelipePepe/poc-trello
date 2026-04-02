import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import { BoardsService } from '../../services/boards.service';
import { ListsService } from '../../services/lists.service';
import { CardsService } from '../../services/cards.service';
import { AuthService } from '../../services/auth.service';
import { CustomFieldsService } from '../../services/custom-fields.service';
import { Board, BoardList, Card, CardFieldValue, CustomField } from '../../models';
import { CardDetailDialogComponent } from '../cards/card-detail-dialog/card-detail-dialog.component';
import { BoardSettingsDialogComponent } from './board-settings-dialog/board-settings-dialog.component';
import { ReconfigureMfaDialogComponent } from '../auth/reconfigure-mfa-dialog.component';

@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterModule,
    FormsModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule,
  ],
  templateUrl: './board-detail.component.html',
  styleUrl: './board-detail.component.scss',
})
export class BoardDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly boardsService = inject(BoardsService);
  private readonly listsService = inject(ListsService);
  private readonly cardsService = inject(CardsService);
  private readonly authService = inject(AuthService);
  private readonly customFieldsService = inject(CustomFieldsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  board = signal<Board | null>(null);
  lists = signal<BoardList[]>([]);
  cardsByList = signal<Record<string, Card[]>>({});
  boardFields = signal<CustomField[]>([]);
  loading = signal(true);

  editingListId = signal<string | null>(null);
  editingListTitle = signal('');
  addingCardListId = signal<string | null>(null);
  newCardTitle = signal('');
  addingList = signal(false);
  newListTitle = signal('');
  editingBoardTitle = signal(false);
  boardTitle = signal('');

  listConnections = computed(() => this.lists().map((l) => `list-${l.id}`));

  private boardId!: string;

  ngOnInit(): void {
    this.boardId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadBoard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBoard(): void {
    this.loading.set(true);
    forkJoin({
      board: this.boardsService.getById(this.boardId),
      lists: this.listsService.getByBoard(this.boardId),
      fields: this.customFieldsService.getByBoard(this.boardId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ board, lists, fields }) => {
          this.board.set(board);
          this.boardTitle.set(board.title);
          this.lists.set(lists);
          this.boardFields.set(fields);
          this.loadAllCards(lists);
        },
        error: () => {
          this.snackBar.open('Error al cargar el tablero', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/boards']);
        },
      });
  }

  private loadAllCards(lists: BoardList[]): void {
    if (lists.length === 0) {
      this.loading.set(false);
      return;
    }
    const cardRequests = lists.map((l) => this.cardsService.getByList(l.id));
    forkJoin(cardRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cardsArrays) => {
          const map: Record<string, Card[]> = {};
          lists.forEach((l, i) => {
            map[l.id] = cardsArrays[i];
          });
          this.cardsByList.set(map);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  getCards(listId: string): Card[] {
    return this.cardsByList()[listId] ?? [];
  }

  // ─── Drag & Drop ────────────────────────────────────────────────────────────

  onListDrop(event: CdkDragDrop<BoardList[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const original = [...this.lists()];
    const updated = [...this.lists()];
    moveItemInArray(updated, event.previousIndex, event.currentIndex);
    this.lists.set(updated);
    this.listsService
      .reorder(
        this.boardId,
        updated.map((l) => l.id),
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => {
          this.lists.set(original);
          this.snackBar.open('Error al reordenar listas', 'Cerrar', { duration: 3000 });
        },
      });
  }

  onCardDrop(event: CdkDragDrop<Card[]>, targetListId: string): void {
    const sourceListId = event.previousContainer.id.replace('list-', '');
    const isSameList = event.previousContainer === event.container;

    const map = { ...this.cardsByList() };

    if (isSameList) {
      const cards = [...(map[targetListId] ?? [])];
      const originalCards = [...cards];
      moveItemInArray(cards, event.previousIndex, event.currentIndex);
      map[targetListId] = cards;
      this.cardsByList.set(map);
      this.cardsService
        .reorder(
          targetListId,
          cards.map((c) => c.id),
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: () => {
            const revertMap = { ...this.cardsByList() };
            revertMap[targetListId] = originalCards;
            this.cardsByList.set(revertMap);
            this.snackBar.open('Error al reordenar tarjetas', 'Cerrar', { duration: 3000 });
          },
        });
    } else {
      const originalSourceCards = [...(map[sourceListId] ?? [])];
      const originalTargetCards = [...(map[targetListId] ?? [])];
      const sourceCards = [...originalSourceCards];
      const targetCards = [...originalTargetCards];
      const movedCard = { ...sourceCards[event.previousIndex], listId: targetListId };

      transferArrayItem(sourceCards, targetCards, event.previousIndex, event.currentIndex);
      targetCards[event.currentIndex] = movedCard;

      map[sourceListId] = sourceCards;
      map[targetListId] = targetCards;
      this.cardsByList.set(map);

      this.cardsService
        .move(movedCard.id, targetListId, event.currentIndex)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: () => {
            const revertMap = { ...this.cardsByList() };
            revertMap[sourceListId] = originalSourceCards;
            revertMap[targetListId] = originalTargetCards;
            this.cardsByList.set(revertMap);
            this.snackBar.open('Error al mover la tarjeta', 'Cerrar', { duration: 3000 });
          },
        });
    }
  }

  // ─── Lists CRUD ─────────────────────────────────────────────────────────────

  startAddList(): void {
    this.addingList.set(true);
    this.newListTitle.set('');
    setTimeout(() => document.getElementById('new-list-input')?.focus(), 50);
  }

  cancelAddList(): void {
    this.addingList.set(false);
    this.newListTitle.set('');
  }

  confirmAddList(): void {
    const title = this.newListTitle().trim();
    if (!title) return;
    this.listsService.create(this.boardId, { title }).subscribe({
      next: (list) => {
        this.lists.update((prev) => [...prev, list]);
        this.cardsByList.update((prev) => ({ ...prev, [list.id]: [] }));
        this.addingList.set(false);
        this.newListTitle.set('');
      },
      error: () => this.snackBar.open('Error al crear lista', 'Cerrar', { duration: 3000 }),
    });
  }

  startEditList(list: BoardList): void {
    this.editingListId.set(list.id);
    this.editingListTitle.set(list.title);
    setTimeout(() => document.getElementById(`edit-list-${list.id}`)?.focus(), 50);
  }

  confirmEditList(list: BoardList): void {
    const title = this.editingListTitle().trim();
    if (!title || title === list.title) {
      this.editingListId.set(null);
      return;
    }
    this.listsService.update(list.id, { title }).subscribe({
      next: (updated) => {
        this.lists.update((prev) => prev.map((l) => (l.id === list.id ? updated : l)));
        this.editingListId.set(null);
      },
      error: () => this.snackBar.open('Error al actualizar lista', 'Cerrar', { duration: 3000 }),
    });
  }

  deleteList(list: BoardList): void {
    if (!confirm(`¿Eliminar la lista "${list.title}" y todas sus tarjetas?`)) return;
    this.listsService.delete(list.id).subscribe({
      next: () => {
        this.lists.update((prev) => prev.filter((l) => l.id !== list.id));
        this.cardsByList.update((prev) => {
          const next = { ...prev };
          delete next[list.id];
          return next;
        });
      },
      error: () => this.snackBar.open('Error al eliminar lista', 'Cerrar', { duration: 3000 }),
    });
  }

  // ─── Cards CRUD ─────────────────────────────────────────────────────────────

  startAddCard(listId: string): void {
    this.addingCardListId.set(listId);
    this.newCardTitle.set('');
    setTimeout(() => document.getElementById(`new-card-${listId}`)?.focus(), 50);
  }

  cancelAddCard(): void {
    this.addingCardListId.set(null);
    this.newCardTitle.set('');
  }

  confirmAddCard(listId: string): void {
    const title = this.newCardTitle().trim();
    if (!title) return;
    this.cardsService.create(listId, { title }).subscribe({
      next: (card) => {
        this.cardsByList.update((prev) => ({
          ...prev,
          [listId]: [...(prev[listId] ?? []), card],
        }));
        this.newCardTitle.set('');
        setTimeout(() => document.getElementById(`new-card-${listId}`)?.focus(), 50);
      },
      error: () => this.snackBar.open('Error al crear tarjeta', 'Cerrar', { duration: 3000 }),
    });
  }

  openBoardSettings(): void {
    const board = this.board();
    if (!board) return;
    this.dialog.open(BoardSettingsDialogComponent, {
      width: '520px',
      maxWidth: '96vw',
      panelClass: 'trello-dialog',
      data: { board },
    });
  }

  openCardDetail(card: Card): void {
    const dialogRef = this.dialog.open(CardDetailDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
      panelClass: 'trello-dialog',
      data: { card, lists: this.lists() },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      if (result.deleted) {
        this.cardsByList.update((prev) => ({
          ...prev,
          [card.listId]: prev[card.listId].filter((c) => c.id !== card.id),
        }));
        return;
      }
      // Merge fieldValues into the card (covers both save and dismiss paths)
      const applyFieldValues = (target: Card): Card => {
        if (!result.fieldValues) return target;
        const customFieldValues: CardFieldValue[] = [];
        (result.fieldValues as Map<string, string | null>).forEach((value, fieldId) => {
          if (value !== null)
            customFieldValues.push({
              id: '',
              cardId: target.id,
              fieldId,
              value,
              createdAt: '',
              updatedAt: '',
            });
        });
        return { ...target, customFieldValues };
      };
      if (result.updated) {
        const updated = applyFieldValues(result.updated as Card);
        this.cardsByList.update((prev) => {
          const next = { ...prev };
          if (updated.listId === card.listId) {
            next[card.listId] = next[card.listId].map((c) => (c.id === card.id ? updated : c));
          } else {
            next[card.listId] = next[card.listId].filter((c) => c.id !== card.id);
            next[updated.listId] = [...(next[updated.listId] ?? []), updated];
          }
          return next;
        });
      } else if (result.fieldValues) {
        // Only field values changed (no save triggered)
        this.cardsByList.update((prev) => ({
          ...prev,
          [card.listId]: prev[card.listId].map((c) => (c.id === card.id ? applyFieldValues(c) : c)),
        }));
      }
    });
  }

  getUserIdentifier(): string {
    const user = this.authService.currentUser();
    if (!user) {
      return 'Invitado';
    }

    return user.email;
  }

  logout(): void {
    this.authService.logout().subscribe({
      error: () => {
        // AuthService already clears session and redirects.
      },
    });
  }

  openReconfigureMfaDialog(): void {
    const dialogRef = this.dialog.open(ReconfigureMfaDialogComponent, {
      width: '540px',
      maxWidth: '96vw',
      panelClass: 'trello-dialog',
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.snackBar.open('MFA reconfigurado correctamente', 'Cerrar', { duration: 2600 });
      }
    });
  }

  deleteCard(event: Event, card: Card): void {
    event.stopPropagation();
    this.cardsService.delete(card.id).subscribe({
      next: () => {
        this.cardsByList.update((prev) => ({
          ...prev,
          [card.listId]: prev[card.listId].filter((c) => c.id !== card.id),
        }));
      },
      error: () => this.snackBar.open('Error al eliminar tarjeta', 'Cerrar', { duration: 3000 }),
    });
  }

  // ─── Board title edit ───────────────────────────────────────────────────────

  startEditBoardTitle(): void {
    this.editingBoardTitle.set(true);
    setTimeout(() => document.getElementById('board-title-input')?.focus(), 50);
  }

  confirmEditBoardTitle(): void {
    const title = this.boardTitle().trim();
    if (!title || title === this.board()?.title) {
      this.editingBoardTitle.set(false);
      return;
    }
    this.boardsService.update(this.boardId, { title }).subscribe({
      next: (b) => {
        this.board.set(b);
        this.editingBoardTitle.set(false);
      },
      error: () => this.snackBar.open('Error al actualizar tablero', 'Cerrar', { duration: 3000 }),
    });
  }

  getContrastColor(hex: string): string {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#172B4D' : '#ffffff';
  }

  getBoardGradient(hex: string): string {
    // Color del tablero como tinte sutil (20%) sobre el tema oscuro global
    return `linear-gradient(160deg, ${hex}33 0%, transparent 55%), linear-gradient(135deg, #0f0c1d 0%, #1a0b32 50%, #0c1a2e 100%)`;
  }

  isDue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  /** Returns {name, value} pairs for custom fields with showOnCard=true that have a value on this card */
  getCardFieldChips(card: Card): { name: string; value: string }[] {
    const showFields = this.boardFields().filter((f) => f.showOnCard);
    if (!showFields.length || !card.customFieldValues?.length) return [];
    return showFields
      .map((f) => {
        const fv = card.customFieldValues!.find((v) => v.fieldId === f.id);
        if (!fv?.value) return null;
        const display = f.type === 'checkbox' ? (fv.value === 'true' ? '✓' : null) : fv.value;
        if (!display) return null;
        return { name: f.name, value: display };
      })
      .filter((x): x is { name: string; value: string } => x !== null);
  }
}
