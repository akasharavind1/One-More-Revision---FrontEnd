import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="app-layout">
      <aside class="app-sidebar">
        <div class="sidebar-brand">
          <span class="brand-mark">OMR</span>
          <div class="brand-text">
            <strong>One More Revision</strong>
            <small>Interview prep workspace</small>
          </div>
        </div>

        <p class="sidebar-label">Menu</p>
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a routerLink="/questions" routerLinkActive="active" class="nav-item">
            <mat-icon>quiz</mat-icon>
            <span>Question Bank</span>
          </a>
          <a routerLink="/import" routerLinkActive="active" class="nav-item">
            <mat-icon>upload_file</mat-icon>
            <span>Import Questions</span>
          </a>
          <a routerLink="/notes" routerLinkActive="active" class="nav-item">
            <mat-icon>description</mat-icon>
            <span>Workspace Notes</span>
          </a>
          <a routerLink="/categories" routerLinkActive="active" class="nav-item">
            <mat-icon>category</mat-icon>
            <span>Categories</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button type="button" class="btn btn-outline-light btn-sm w-100" (click)="auth.logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div class="app-main">
        <header class="app-topbar">
          <div>
            <h2 class="topbar-title mb-0">One More Revision</h2>
            <p class="topbar-subtitle mb-0">Track questions, notes, and practice</p>
          </div>
          <div class="d-flex align-items-center gap-3">
            <span class="user-pill">
              <mat-icon>person</mat-icon>
              {{ (auth.user$ | async)?.displayName }}
            </span>
            <button
              type="button"
              mat-icon-button
              class="topbar-logout"
              aria-label="Logout"
              (click)="auth.logout()"
            >
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </header>

        <main class="app-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
}
