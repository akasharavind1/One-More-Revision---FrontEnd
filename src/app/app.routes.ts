import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  // =========================
  // LOGIN
  // =========================

  {
    path: 'login',

    loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent),
  },

  // =========================
  // PROTECTED APPLICATION
  // =========================

  {
    path: '',

    canActivate: [authGuard],

    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),

    children: [
      // Default
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      // =========================
      // DASHBOARD
      // =========================

      {
        path: 'dashboard',

        loadComponent: () =>
          import('./pages/dashboard.component').then((m) => m.DashboardComponent),
      },

      // =========================
      // QUESTION BANK
      // =========================

      {
        path: 'questions',

        loadComponent: () =>
          import('./pages/question-bank.component').then((m) => m.QuestionBankComponent),
      },

      // =========================
      // IMPORT
      // =========================

      {
        path: 'import',

        loadComponent: () => import('./pages/import.component').then((m) => m.ImportComponent),
      },

      // =========================
      // WORKSPACE NOTES
      // =========================

      {
        path: 'notes',

        loadComponent: () => import('./pages/notes.component').then((m) => m.NotesComponent),
      },

      // =========================
      // STUDY VIEW
      // =========================

      {
        path: 'notes/study',

        loadComponent: () =>
          import('./pages/study-view.component').then((m) => m.StudyViewComponent),
      },

      // =========================
      // CATEGORIES
      // =========================

      {
        path: 'categories',

        loadComponent: () =>
          import('./pages/categories.component').then((m) => m.CategoriesComponent),
      },
    ],
  },

  // =========================
  // FALLBACK
  // =========================

  {
    path: '**',
    redirectTo: '',
  },
];
