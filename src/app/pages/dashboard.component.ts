import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../core/api.service';
import { DashboardStats } from '../core/models';
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `<div class="page">
    <div class="page-head">
      <div>
        <h1>Dashboard</h1>
        <p>Keep your interview preparation moving forward.</p>
      </div>
      <div>
        <a mat-flat-button routerLink="/import"><mat-icon>upload_file</mat-icon>Import Questions</a
        ><a mat-stroked-button routerLink="/notes">Workspace Notes</a>
      </div>
    </div>
    <div class="stats" *ngIf="stats">
      <mat-card
        ><span>Total Questions</span><strong>{{ stats.totalQuestions }}</strong></mat-card
      ><mat-card
        ><span>Studied</span><strong>{{ stats.studied }}</strong></mat-card
      ><mat-card
        ><span>Not Studied</span><strong>{{ stats.notStudied }}</strong></mat-card
      ><mat-card
        ><span>Practice Sessions</span><strong>{{ stats.practiceSessions }}</strong></mat-card
      ><mat-card
        ><span>Workspace Notes</span><strong>{{ stats.workspaceNotes }}</strong></mat-card
      ><mat-card
        ><span>Categories</span><strong>{{ stats.categories }}</strong></mat-card
      >
    </div>
    <div class="dashboard-grid" *ngIf="stats">
      <mat-card
        ><mat-card-header><mat-card-title>Recently Practiced</mat-card-title></mat-card-header
        ><mat-card-content
          ><div class="mini-row" *ngFor="let q of stats.recentlyPracticed">
            <span>{{ q.question }}</span
            ><b>{{ q.practiceCount }}×</b>
          </div>
          <div class="empty" *ngIf="!stats.recentlyPracticed.length">
            No questions yet.
          </div></mat-card-content
        ></mat-card
      ><mat-card
        ><mat-card-header
          ><mat-card-title>Questions You Haven't Studied</mat-card-title></mat-card-header
        ><mat-card-content
          ><a
            class="mini-row link"
            *ngFor="let q of stats.notStudiedQuestions"
            routerLink="/questions"
            ><span>{{ q.question }}</span></a
          >
          <div class="empty" *ngIf="!stats.notStudiedQuestions.length">
            Everything is studied. Nice work!
          </div></mat-card-content
        ></mat-card
      >
    </div>
  </div>`,
})
export class DashboardComponent {
  private api = inject(ApiService);
  stats?: DashboardStats;
  ngOnInit() {
    this.api.dashboard().subscribe((s) => (this.stats = s));
  }
}
