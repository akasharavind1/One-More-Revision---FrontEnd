import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

import { ApiService } from '../core/api.service';
import { Category, Question, Subcategory } from '../core/models';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { ToastService } from '../shared/toast.service';
import {
  QuestionEditDialogComponent,
  QuestionEditResult,
} from '../shared/question-edit-dialog.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Question Bank</h1>
          <p>Search, filter and track your interview questions.</p>
        </div>

        <div class="page-actions">
          <button mat-flat-button type="button" (click)="add()">
            <mat-icon>add</mat-icon>
            Add Question
          </button>
          <a mat-stroked-button routerLink="/import">
            Import Questions
          </a>
        </div>
      </div>

      <div class="filters">
        <!-- Search -->
        <mat-form-field appearance="outline">
          <mat-label>Search question</mat-label>

          <input matInput [(ngModel)]="search" (keyup.enter)="load()" />

          <button mat-icon-button matSuffix (click)="load()">
            <mat-icon>search</mat-icon>
          </button>
        </mat-form-field>

        <!-- Category -->
        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>

          <mat-select [(ngModel)]="categoryId" (selectionChange)="categoryChanged()">
            <mat-option [value]="null"> All categories </mat-option>

            <mat-option *ngFor="let c of categories" [value]="c.id">
              {{ c.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Subcategory -->
        <mat-form-field appearance="outline">
          <mat-label>Subcategory</mat-label>

          <mat-select [(ngModel)]="subcategoryId" (selectionChange)="subcategoryChanged()">
            <mat-option [value]="null"> All Subcategories </mat-option>

            <mat-option *ngFor="let s of subs" [value]="s.id">
              {{ s.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Studied -->
        <mat-form-field appearance="outline">
          <mat-label>Studied</mat-label>

          <mat-select [(ngModel)]="studied" (selectionChange)="studiedChanged()">
            <mat-option [value]="null"> All Studied Status </mat-option>

            <mat-option [value]="true"> Studied </mat-option>

            <mat-option [value]="false"> Not studied </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Clear -->
        <button mat-button (click)="clear()">Clear</button>
      </div>

      <!-- Question Table -->
      <div class="table-wrap">
        <table
          mat-table
          [dataSource]="rows"
          matSort
          matSortActive="updatedAt"
          matSortDirection="desc"
          matSortDisableClear
          (matSortChange)="onSortChange($event)"
        >
          <!-- Category -->
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="category.name">Category</th>

            <td mat-cell *matCellDef="let q">
              {{ q.category.name }}
            </td>
          </ng-container>

          <!-- Subcategory -->
          <ng-container matColumnDef="subcategory">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="subcategory.name">
              Subcategory
            </th>

            <td mat-cell *matCellDef="let q">
              {{ q.subcategory?.name || '—' }}
            </td>
          </ng-container>

          <!-- Question -->
          <ng-container matColumnDef="question">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="question">Question</th>

            <td mat-cell *matCellDef="let q" class="question-cell">
              {{ q.question }}
            </td>
          </ng-container>

          <!-- Question Source -->
          <ng-container matColumnDef="source">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="questionSource">
              Question Source
            </th>

            <td mat-cell *matCellDef="let q">
              <a
                *ngIf="q.questionSourceUrl"
                [href]="q.questionSourceUrl"
                target="_blank"
                rel="noopener"
              >
                {{ q.questionSource || 'Open' }}
              </a>

              <span *ngIf="!q.questionSourceUrl">
                {{ q.questionSource || '—' }}
              </span>
            </td>
          </ng-container>

          <!-- Answer Source -->
          <ng-container matColumnDef="answerSource">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="answerSource">
              Answer Source
            </th>

            <td mat-cell *matCellDef="let q">
              <a
                *ngIf="hasWorkspaceNote(q)"
                [routerLink]="['/notes/study']"
                [queryParams]="{ questionId: q.id }"
              >
                {{ q.answerSource || 'View my answer' }}
              </a>

              <a
                *ngIf="!hasWorkspaceNote(q) && q.answerSourceUrl"
                [href]="q.answerSourceUrl"
                target="_blank"
                rel="noopener"
              >
                {{ q.answerSource || 'Open' }}
              </a>

              <span *ngIf="!hasWorkspaceNote(q) && !q.answerSourceUrl">
                {{ q.answerSource || '—' }}
              </span>
            </td>
          </ng-container>

          <!-- Studied -->
          <ng-container matColumnDef="studied">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="studiedBefore">Studied</th>

            <td mat-cell *matCellDef="let q">
              <mat-slide-toggle
                [checked]="q.studiedBefore"
                (change)="toggleStudied(q, $event.checked)"
              >
              </mat-slide-toggle>
            </td>
          </ng-container>

          <!-- Updated At -->
          <ng-container matColumnDef="updatedAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="updatedAt">Updated At</th>

            <td mat-cell *matCellDef="let q">
              {{ q.updatedAt | date: 'dd MMM yyyy, HH:mm' }}
            </td>
          </ng-container>

          <!-- Practice -->
          <ng-container matColumnDef="practice">
            <th mat-header-cell *matHeaderCellDef>Practice</th>

            <td mat-cell *matCellDef="let q">
              <div class="practice">
                <button mat-icon-button (click)="changePractice(q, -1)">
                  <mat-icon>remove</mat-icon>
                </button>

                <b>
                  {{ q.practiceCount }}
                </b>

                <button mat-icon-button (click)="changePractice(q, 1)">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>

            <td mat-cell *matCellDef="let q">
              <button mat-icon-button title="Edit" (click)="edit(q)">
                <mat-icon>edit</mat-icon>
              </button>

              <button mat-icon-button color="warn" title="Delete" (click)="remove(q)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>

          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>

        <div class="empty" *ngIf="!loading && !rows.length">No questions match your filters.</div>

        <mat-paginator
          [length]="total"
          [pageIndex]="page"
          [pageSize]="size"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="paginate($event)"
        >
        </mat-paginator>
      </div>
    </div>
  `,
})
export class QuestionBankComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  rows: Question[] = [];

  categories: Category[] = [];

  /*
   * Contains all subcategories when no category is selected.
   * Contains category-specific subcategories when a category is selected.
   */
  subs: Subcategory[] = [];

  private notesByQuestionId = new Map<number, number>();

  cols = [
    'category',
    'subcategory',
    'question',
    'source',
    'answerSource',
    'studied',
    'practice',
    'updatedAt',
    'actions',
  ];

  /*
   * null means "All".
   */
  search = '';

  categoryId: number | null = null;

  subcategoryId: number | null = null;

  studied: boolean | null = null;

  page = 0;

  size = 20;

  total = 0;

  loading = false;

  sortParam = 'updatedAt,desc';

  ngOnInit(): void {
    /*
     * Load categories.
     */
    this.api.categories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Failed to load categories', error);
      },
    });

    this.api.allNotes().subscribe({
      next: (notes) => {
        this.notesByQuestionId.clear();
        for (const note of notes) {
          this.notesByQuestionId.set(note.question.id, note.id);
        }
      },
    });

    /*
     * Initially category = All.
     *
     * Therefore load ALL subcategories.
     */
    this.loadAllSubcategories();

    /*
     * Initially:
     *
     * categoryId     = null
     * subcategoryId  = null
     * studied        = null
     *
     * Therefore the first request loads all questions.
     */
    this.load();
  }

  /**
   * Load all subcategories.
   *
   * Used when Category = All.
   */
  private loadAllSubcategories(): void {
    this.api.allSubcategories().subscribe({
      next: (subcategories) => {
        this.subs = subcategories;
      },
      error: (error) => {
        console.error('Failed to load subcategories', error);
      },
    });
  }

  /**
   * Called whenever Category changes.
   */
  categoryChanged(): void {
    /*
     * Changing category resets the selected subcategory.
     */
    this.subcategoryId = null;

    /*
     * Reset pagination.
     */
    this.page = 0;

    if (this.categoryId === null) {
      /*
       * Category = All.
       *
       * Show every subcategory.
       */
      this.loadAllSubcategories();
    } else {
      /*
       * A category was selected.
       *
       * Show only subcategories belonging
       * to that category.
       */
      this.api.subcategories(this.categoryId).subscribe({
        next: (subcategories) => {
          this.subs = subcategories;
        },
        error: (error) => {
          console.error('Failed to load category subcategories', error);

          this.subs = [];
        },
      });
    }

    /*
     * Reload questions using the selected category.
     */
    this.load();
  }

  /**
   * Called when Subcategory changes.
   *
   * This works independently of Category.
   */
  subcategoryChanged(): void {
    this.page = 0;

    this.load();
  }

  /**
   * Called when Studied filter changes.
   */
  studiedChanged(): void {
    this.page = 0;

    this.load();
  }

  /**
   * Load questions based on current filters.
   */
  load(): void {
    this.loading = true;

    this.api
      .questions({
        page: this.page,
        size: this.size,

        /*
         * null means don't send the parameter.
         */
        categoryId: this.categoryId ?? undefined,

        subcategoryId: this.subcategoryId ?? undefined,

        studiedBefore: this.studied ?? undefined,

        search: this.search,

        sort: this.sortParam,
      })
      .subscribe({
        next: (p) => {
          this.rows = p.content;

          this.total = p.totalElements;

          this.loading = false;
        },

        error: (error) => {
          console.error('Failed to load questions', error);

          this.rows = [];

          this.total = 0;

          this.loading = false;
        },
      });
  }

  onSortChange(sort: Sort): void {
    if (!sort.active || !sort.direction) {
      this.sortParam = 'updatedAt,desc';
    } else {
      this.sortParam = `${sort.active},${sort.direction}`;
    }

    this.page = 0;
    this.load();
  }

  /**
   * Pagination.
   */
  paginate(event: PageEvent): void {
    this.page = event.pageIndex;

    this.size = event.pageSize;

    this.load();
  }

  /**
   * Reset all filters.
   */
  clear(): void {
    this.search = '';

    this.categoryId = null;

    this.subcategoryId = null;

    this.studied = null;

    this.page = 0;

    /*
     * Category is now All,
     * therefore show all subcategories again.
     */
    this.loadAllSubcategories();

    /*
     * Load all questions.
     */
    this.load();
  }

  /**
   * Update studied status.
   */
  toggleStudied(q: Question, value: boolean): void {
    this.api.studied(q.id, value).subscribe({
      next: (response) => {
        q.studiedBefore = response.studiedBefore;
      },

      error: (error) => {
        console.error('Failed to update studied status', error);
      },
    });
  }

  /**
   * Increase/decrease practice count.
   */
  changePractice(q: Question, delta: number): void {
    if (delta === -1 && q.practiceCount === 0) {
      return;
    }

    const next = q.practiceCount + delta;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Mark this question as practiced?',

        message: `Current count: ${q.practiceCount}\n` + `New count: ${next}`,

        confirmText: 'Confirm',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) {
        return;
      }

      this.api.practice(q.id, delta).subscribe({
        next: (response) => {
          q.practiceCount = response.practiceCount;
        },

        error: (error) => {
          console.error('Failed to update practice count', error);
        },
      });
    });
  }

  /**
   * Delete question.
   */
  remove(q: Question): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Question?',

        message:
          `Are you sure you want to delete: ` +
          `"${q.question}"? ` +
          `This action cannot be undone.`,

        confirmText: 'Delete',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) {
        return;
      }

      this.api.deleteQuestion(q.id).subscribe({
        next: () => {
          this.rows = this.rows.filter((x) => x.id !== q.id);

          this.total--;

          this.toast.show('Question deleted');
        },

        error: (error) => {
          console.error('Failed to delete question', error);
        },
      });
    });
  }

  hasWorkspaceNote(q: Question): boolean {
    return this.notesByQuestionId.has(q.id);
  }

  add(): void {
    const ref = this.dialog.open(QuestionEditDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        mode: 'create',
        categories: this.categories,
      },
    });

    ref.afterClosed().subscribe((result: QuestionEditResult | undefined) => {
      if (!result) {
        return;
      }

      this.api.createQuestion(this.payloadFromResult(result)).subscribe({
        next: () => {
          this.toast.show('Question added');
          this.load();
          this.api.categories().subscribe((c) => (this.categories = c));
        },
        error: (error) => {
          this.toast.show(error?.error?.message || 'Failed to add question');
        },
      });
    });
  }

  edit(q: Question): void {
    const ref = this.dialog.open(QuestionEditDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,

      data: {
        mode: 'edit',
        question: q,
        categories: this.categories,
      },
    });

    ref.afterClosed().subscribe((result: QuestionEditResult | undefined) => {
      if (!result) {
        return;
      }

      this.api.updateQuestion(q.id, this.payloadFromResult(result))
        .subscribe({
          next: (response) => {
            /*
             * Replace the row with the latest
             * backend response.
             */
            Object.assign(q, response);

            this.toast.show('Question updated successfully');
          },

          error: (error) => {
            console.error('Failed to update question', error);

            this.toast.show(error?.error?.message || 'Failed to update question');
          },
        });
    });
  }

  private payloadFromResult(result: QuestionEditResult) {
    return {
      categoryId: result.categoryId,
      subcategoryId: result.subcategoryId,
      question: result.question,
      questionSource: result.questionSource,
      questionSourceUrl: result.questionSourceUrl,
      answerSource: result.answerSource,
      answerSourceUrl: result.answerSourceUrl,
      studiedBefore: result.studiedBefore,
      practiceCount: result.practiceCount,
    };
  }
}
