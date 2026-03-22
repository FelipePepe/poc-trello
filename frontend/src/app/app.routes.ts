import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Iniciar sesión',
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/boards/boards.component').then((m) => m.BoardsComponent),
    title: 'Tableros — Trello Clone',
  },
  {
    path: 'board/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/board-detail/board-detail.component').then(
        (m) => m.BoardDetailComponent
      ),
    title: 'Tablero — Trello Clone',
  },
  { path: '**', redirectTo: '' },
];
