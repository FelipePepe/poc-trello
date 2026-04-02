import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { MfaVerifyComponent } from './features/auth/mfa-verify.component';
import { BoardsComponent } from './features/boards/boards.component';
import { BoardDetailComponent } from './features/board-detail/board-detail.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Iniciar sesión',
  },
  {
    path: 'mfa-verify',
    component: MfaVerifyComponent,
    title: 'Verificación MFA',
  },
  {
    path: 'boards',
    canActivate: [authGuard],
    component: BoardsComponent,
    title: 'Tableros — Trello Clone',
  },
  {
    path: 'boards/:id',
    canActivate: [authGuard],
    component: BoardDetailComponent,
    title: 'Tablero — Trello Clone',
  },
  { path: '', redirectTo: 'boards', pathMatch: 'full' },
  { path: '**', redirectTo: 'boards' },
];
