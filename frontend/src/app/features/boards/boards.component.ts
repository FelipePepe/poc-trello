import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { BoardsService } from '../../services/boards.service';
import { AuthService } from '../../services/auth.service';
import { Board } from '../../models';
import { CreateBoardDialogComponent } from './create-board-dialog/create-board-dialog.component';
import { ReconfigureMfaDialogComponent } from '../auth/reconfigure-mfa-dialog.component';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './boards.component.html',
  styleUrl: './boards.component.scss',
})
export class BoardsComponent implements OnInit {
  private boardsService = inject(BoardsService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  boards = signal<Board[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadBoards();
  }

  loadBoards(): void {
    this.loading.set(true);
    this.boardsService.getAll().subscribe({
      next: (boards) => {
        this.boards.set(boards);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar tableros', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateBoardDialogComponent, {
      width: '480px',
      panelClass: 'trello-dialog',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.boardsService.create(result).subscribe({
          next: (board) => {
            this.boards.update((prev) => [...prev, board]);
            this.snackBar.open('Tablero creado', 'Cerrar', { duration: 2000 });
          },
          error: () => this.snackBar.open('Error al crear tablero', 'Cerrar', { duration: 3000 }),
        });
      }
    });
  }

  deleteBoard(event: Event, board: Board): void {
    event.stopPropagation();
    event.preventDefault();
    if (!confirm(`¿Eliminar "${board.title}" y todos sus datos?`)) return;
    this.boardsService.delete(board.id).subscribe({
      next: () => {
        this.boards.update((prev) => prev.filter((b) => b.id !== board.id));
        this.snackBar.open('Tablero eliminado', 'Cerrar', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error al eliminar tablero', 'Cerrar', { duration: 3000 }),
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

  getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#172B4D' : '#ffffff';
  }
}
