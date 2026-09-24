import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../core/api.service';
import { Note } from '../core/models';

interface StudyGroup {
  category: string;
  notes: Note[];
}

@Component({
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
  ],

  template: `
    <div class="study-page">
      <!-- ========================= -->
      <!-- HEADER -->
      <!-- ========================= -->

      <div class="study-header">
        <div>
          <div class="title-row">
            <div class="title-icon">
              <mat-icon>menu_book</mat-icon>
            </div>

            <div>
              <h1>Study View</h1>

              <p>Review your questions and personal answers category by category.</p>
            </div>
          </div>
        </div>

        <a mat-stroked-button routerLink="/notes">
          <mat-icon>arrow_back</mat-icon>
          Workspace Notes
        </a>
      </div>

      <!-- ========================= -->
      <!-- LOADING -->
      <!-- ========================= -->

      <div class="state" *ngIf="loading">
        <mat-icon>sync</mat-icon>

        <h3>Loading your study notes...</h3>

        <p>Preparing your questions and answers.</p>
      </div>

      <!-- ========================= -->
      <!-- EMPTY -->
      <!-- ========================= -->

      <div class="state" *ngIf="!loading && !groups.length">
        <mat-icon>menu_book</mat-icon>

        <h3>No workspace notes yet</h3>

        <p>Create some workspace notes first, then come back here to study them.</p>

        <a mat-flat-button routerLink="/notes">
          <mat-icon>add</mat-icon>
          Create Workspace Note
        </a>
      </div>

      <!-- ========================= -->
      <!-- STUDY CONTENT -->
      <!-- ========================= -->

      <div class="study-content" *ngIf="!loading && groups.length">
        <div class="study-layout">
        <!-- SUMMARY -->
        <div class="study-summary">
          <div class="summary-item">
            <mat-icon>category</mat-icon>

            <div>
              <span>Categories</span>

              <strong>
                {{ groups.length }}
              </strong>
            </div>
          </div>

          <div class="summary-item">
            <mat-icon>quiz</mat-icon>

            <div>
              <span>Questions</span>

              <strong>
                {{ totalQuestions }}
              </strong>
            </div>
          </div>
        </div>

        <nav class="category-quick-nav" aria-label="Jump to category">
          <button
            type="button"
            *ngFor="let group of groups; let gi = index"
            class="category-quick-btn"
            (click)="scrollToCategory(group.category)"
          >
            <span class="cat-num">{{ gi + 1 }}</span>
            {{ group.category }}
            <span class="cat-count">{{ group.notes.length }}</span>
          </button>
        </nav>

        <!-- ========================= -->
        <!-- CATEGORY -->
        <!-- ========================= -->

        <section
          class="study-category"
          *ngFor="let group of groups"
          [attr.id]="'study-cat-' + categorySlug(group.category)"
        >
          <!-- CATEGORY HEADER -->

          <div class="category-header">
            <div class="category-title-centered">
              <span class="category-pill">{{ categoryIndex(group) }}</span>
              <h2>{{ group.category }}</h2>
              <span class="category-count">
                {{ group.notes.length }}
                {{ group.notes.length === 1 ? 'question' : 'questions' }}
              </span>
            </div>
          </div>

          <!-- ========================= -->
          <!-- QUESTIONS -->
          <!-- ========================= -->

          <div class="questions">
            <mat-card
              class="study-card"
              *ngFor="let note of group.notes; let i = index"
              [attr.id]="'study-q-' + note.question.id"
            >
              <div class="study-card-body">
                <div class="study-card-question">
                  <div class="question-top">
                    <div class="question-number">
                      {{ i + 1 }}
                    </div>

                    <div class="question-heading">
                      <div class="metadata">
                        <span class="subcategory">
                          {{ note.question.subcategory?.name || 'General' }}
                        </span>
                      </div>

                      <h3>
                        {{ note.question.question }}
                      </h3>
                    </div>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <div class="study-card-answer">
                  <div class="answer-section">
                    <div class="answer-heading">
                      <mat-icon> lightbulb </mat-icon>

                      <span> My Answer </span>
                    </div>

                    <div class="answer">
                      {{ note.answer }}
                    </div>
                  </div>
                </div>
              </div>
            </mat-card>
          </div>
        </section>
        </div>
      </div>
    </div>
  `,

  styles: [
    `
      .study-page {
        max-width: none;
        width: 100%;
        margin: 0;
        padding: 16px 20px 32px;
        box-sizing: border-box;
      }

      .study-layout {
        width: 100%;
        max-width: none;
      }

      .category-quick-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 18px;
      }

      .category-quick-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border: 1px solid #e2e8f0;
        border-radius: 999px;
        background: #fff;
        font: inherit;
        font-size: 13px;
        color: #111827;
        cursor: pointer;
      }

      .category-quick-btn:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      .category-quick-btn .cat-num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border-radius: 999px;
        background: #2563eb;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
      }

      .category-quick-btn .cat-count {
        font-size: 11px;
        color: #94a3b8;
        font-weight: 600;
      }

      /* =========================
       HEADER
       ========================= */

      .study-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 16px;
      }

      .title-row {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .title-icon {
        width: 52px;
        height: 52px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #111827;
        color: white;
      }

      .title-icon mat-icon {
        font-size: 27px;
        width: 27px;
        height: 27px;
      }

      .study-header h1 {
        margin: 0 0 5px;
        font-size: 30px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .study-header p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
      }

      /* =========================
       SUMMARY
       ========================= */

      .study-summary {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
      }

      .summary-item {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 190px;
        padding: 14px 18px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
      }

      .summary-item mat-icon {
        color: #4b5563;
      }

      .summary-item span {
        display: block;
        color: #6b7280;
        font-size: 12px;
        margin-bottom: 2px;
      }

      .summary-item strong {
        font-size: 20px;
      }

      /* =========================
       CATEGORY
       ========================= */

      .study-category {
        margin-bottom: 22px;
      }

      .category-header {
        display: flex;
        justify-content: center;
        margin-bottom: 12px;
      }

      .category-title-centered {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 4px;
        padding: 10px 24px;
        border-radius: 999px;
        background: linear-gradient(135deg, #eff6ff, #f8fafc);
        border: 1px solid #dbeafe;
        min-width: min(420px, 100%);
      }

      .category-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        background: #2563eb;
        color: #fff;
        font-size: 12px;
        font-weight: 700;
      }

      .category-title-centered h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
      }

      .category-count {
        color: #64748b;
        font-size: 12px;
        font-weight: 500;
      }

      /* =========================
       QUESTION CARD
       ========================= */

      .questions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .study-card {
        padding: 0;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: none;
        background: white;
        min-height: 0;
        overflow: hidden;
      }

      .study-card-body {
        display: flex;
        flex-direction: column;
      }

      .study-card-question {
        padding: 18px 22px;
        background: #fafbfc;
      }

      .study-card-answer {
        padding: 16px 22px 22px;
      }

      .question-top {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .question-number {
        flex: 0 0 32px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #f1f5f9;
        color: #111827;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
      }

      .question-heading {
        flex: 1;
        min-width: 0;
      }

      .metadata {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 9px;
        flex-wrap: wrap;
      }

      .checklist,
      .subcategory {
        display: inline-flex;
        align-items: center;
        padding: 4px 9px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .subcategory {
        background: #f8fafc;
        color: #64748b;
      }

      .question-heading h3 {
        margin: 0;
        font-size: 16px;
        line-height: 1.45;
        font-weight: 650;
        color: #111827;
      }

      /* =========================
       ANSWER
       ========================= */

      .answer-section {
        margin-top: 0;
      }

      .answer-heading {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 700;
        color: #374151;
      }

      .answer-heading mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .answer {
        display: block;
        width: 100%;
        box-sizing: border-box;
        padding: 16px 20px;
        background: #f8fafc;
        border: 1px solid #edf0f4;
        border-radius: 10px;
        white-space: pre-wrap;
        word-break: normal;
        overflow-wrap: break-word;
        line-height: 1.6;
        color: #374151;
        font-size: 15px;
        min-height: 3em;
        text-align: left;
      }

      /* =========================
       STATES
       ========================= */

      .state {
        min-height: 350px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: #6b7280;
      }

      .state mat-icon {
        width: 48px;
        height: 48px;
        font-size: 48px;
        margin-bottom: 12px;
        color: #94a3b8;
      }

      .state h3 {
        margin: 0 0 7px;
        color: #374151;
      }

      .state p {
        margin: 0 0 20px;
      }

      /* =========================
       RESPONSIVE
       ========================= */

      @media (max-width: 720px) {
        .study-page {
          padding: 20px 16px 40px;
        }

        .study-header {
          align-items: flex-start;
          flex-direction: column;
        }

        .study-header a {
          width: 100%;
        }

        .study-summary {
          flex-direction: column;
        }

        .summary-item {
          width: 100%;
        }

        .study-card {
          padding: 18px;
        }

        .question-top {
          gap: 10px;
        }

        .question-heading h3 {
          font-size: 16px;
        }
      }
    `,
  ],
})
export class StudyViewComponent {
  private api = inject(ApiService);

  private route = inject(ActivatedRoute);

  groups: StudyGroup[] = [];

  loading = false;

  totalQuestions = 0;

  private scrollQuestionId?: number;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const raw = params.get('questionId');
      this.scrollQuestionId = raw ? Number(raw) : undefined;
      this.loadNotes();
    });
  }

  private loadNotes(): void {
    this.loading = true;

    /*
     * Fetch all workspace notes needed for Study View.
     *
     * The backend is paginated, so we request a large page here.
     */
    this.api.notes(0, 1000).subscribe({
      next: (page) => {
        this.buildGroups(page.content);

        this.loading = false;

        this.scrollToQuestionIfNeeded();
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  private buildGroups(notes: Note[]): void {
    const sorted = [...notes].sort((a, b) => {
      const categoryCompare = (a.question.category?.name || 'Uncategorized').localeCompare(
        b.question.category?.name || 'Uncategorized',
      );

      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return a.question.question.localeCompare(b.question.question, undefined, {
        sensitivity: 'base',
      });
    });

    const map = new Map<string, Note[]>();

    for (const note of sorted) {
      const category = note.question.category?.name || 'Uncategorized';

      if (!map.has(category)) {
        map.set(category, []);
      }

      map.get(category)!.push(note);
    }

    this.groups = Array.from(map.entries()).map(([category, notes]) => ({
      category,
      notes,
    }));

    this.totalQuestions = notes.length;
  }

  categoryIndex(group: StudyGroup): number {
    return this.groups.indexOf(group) + 1;
  }

  categorySlug(category: string): string {
    return category.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
  }

  scrollToCategory(category: string): void {
    document
      .getElementById(`study-cat-${this.categorySlug(category)}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToQuestion(questionId: number): void {
    document
      .getElementById(`study-q-${questionId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private scrollToQuestionIfNeeded(): void {
    if (!this.scrollQuestionId) {
      return;
    }

    setTimeout(() => {
      document
        .getElementById(`study-q-${this.scrollQuestionId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}
