import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then(m => m.LoginPage),
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/project-list.page').then(m => m.ProjectListPage),
    canActivate: [authGuard],
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./features/projects/project-detail.page').then(m => m.ProjectDetailPage),
    canActivate: [authGuard],
  },
  { path: '', redirectTo: 'projects', pathMatch: 'full' },
  { path: '**', redirectTo: 'projects' },
];
