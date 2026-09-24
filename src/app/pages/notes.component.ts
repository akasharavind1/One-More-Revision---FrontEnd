import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';

import { ApiService } from '../core/api.service';
import { Category, Question, Note, Subcategory } from '../core/models';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { ToastService } from '../shared/toast.service';
import { CREATE_NEW_ID } from '../shared/question-edit-dialog.component';

interface BulkNoteRow {
  question?: Question;
  answer: string;
  search: string;
  results: Question[];
}

@Component({
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCardModule,
    MatDividerModule,
    MatTableModule,
    MatSortModule,
  ],

  template: `
    <div class="page">
      <!-- ========================= -->
      <!-- PAGE HEADER -->
      <!-- ========================= -->

      <div class="page-head">
        <div>
          <h1>Workspace Notes</h1>

          <p>Your personal answers and study notes, kept separate from imported question data.</p>
        </div>

        <div class="page-actions">
          <!-- STUDY VIEW -->
          <a mat-stroked-button color="primary" routerLink="/notes/study">
            <mat-icon>menu_book</mat-icon>
            Study View
          </a>

          <!-- CREATE NOTE -->
          <button mat-stroked-button (click)="startBulk()">
            <mat-icon>playlist_add</mat-icon>
            Bulk save
          </button>

          <button mat-flat-button (click)="start()">
            <mat-icon>add</mat-icon>
            Create Workspace Note
          </button>
        </div>
      </div>

      <!-- ========================= -->
      <!-- CREATE / EDIT FORM -->
      <!-- ========================= -->

      <mat-card class="editor bulk-editor" *ngIf="bulkEditing">
        <mat-card-header>
          <mat-card-title>Bulk save workspace notes</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <p class="bulk-intro">
            Add multiple questions and answers, then save them in one step. Existing notes for the
            same question are updated.
          </p>

          <div class="bulk-rows">
            <div class="bulk-row" *ngFor="let row of bulkRows; let i = index">
              <div class="bulk-row-toolbar">
                <span class="bulk-row-num">#{{ i + 1 }}</span>
                <button
                  mat-icon-button
                  type="button"
                  title="Remove row"
                  (click)="removeBulkRow(i)"
                  [disabled]="bulkRows.length === 1"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <div class="bulk-row-question" *ngIf="row.question">
                <div>
                  <small>{{ row.question.category.name }}</small>
                  <strong>{{ row.question.question }}</strong>
                </div>
                <button mat-button type="button" (click)="clearBulkQuestion(i)">Change</button>
              </div>

              <ng-container *ngIf="!row.question">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Search question</mat-label>
                  <mat-icon matPrefix>search</mat-icon>
                  <input
                    matInput
                    [(ngModel)]="row.search"
                    (ngModelChange)="onBulkRowSearch(i, $event)"
                    placeholder="Type at least 2 characters"
                  />
                </mat-form-field>

                <ul class="question-search-results bulk-results" *ngIf="row.results.length">
                  <li *ngFor="let q of row.results">
                    <button type="button" class="search-result-btn" (click)="pickBulkQuestion(i, q)">
                      <span class="search-result-meta">
                        {{ q.category.name }}
                        <ng-container *ngIf="q.subcategory"> · {{ q.subcategory.name }}</ng-container>
                      </span>
                      <span class="search-result-text">{{ q.question }}</span>
                    </button>
                  </li>
                </ul>
              </ng-container>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>My answer / notes</mat-label>
                <textarea matInput rows="4" [(ngModel)]="row.answer"></textarea>
              </mat-form-field>
            </div>
          </div>

          <button mat-stroked-button type="button" (click)="addBulkRow()">
            <mat-icon>add</mat-icon>
            Add another row
          </button>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button type="button" (click)="cancelBulk()">Cancel</button>
          <button
            mat-flat-button
            type="button"
            [disabled]="!bulkReadyCount || bulkSaving"
            (click)="saveBulk()"
          >
            Save {{ bulkReadyCount }} note{{ bulkReadyCount === 1 ? '' : 's' }}
          </button>
        </mat-card-actions>
      </mat-card>

      <mat-card class="editor" *ngIf="editing">
        <mat-card-header>
          <mat-card-title>
            {{ editing.id ? 'Edit' : 'Create' }}
            Workspace Note
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div class="question-search-block">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Search question</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input
                matInput
                [(ngModel)]="questionSearch"
                (ngModelChange)="questionSearchInput.next($event)"
                placeholder="Type to find a question across all categories"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                *ngIf="questionSearch"
                (click)="clearQuestionSearch()"
                aria-label="Clear search"
              >
                <mat-icon>close</mat-icon>
              </button>
            </mat-form-field>

            <p class="search-hint" *ngIf="questionSearch.trim() && !questionSearchLoading && !questionSearchResults.length">
              No questions match “{{ questionSearch.trim() }}”.
            </p>

            <ul class="question-search-results" *ngIf="questionSearchResults.length">
              <li *ngFor="let q of questionSearchResults">
                <button type="button" class="search-result-btn" (click)="pickQuestionFromSearch(q)">
                  <span class="search-result-meta">
                    {{ q.category.name }}
                    <ng-container *ngIf="q.subcategory"> · {{ q.subcategory.name }}</ng-container>
                  </span>
                  <span class="search-result-text">{{ q.question }}</span>
                </button>
              </li>
            </ul>
          </div>

          <div class="browse-divider">
            <mat-divider></mat-divider>
            <span>Or browse by category</span>
            <mat-divider></mat-divider>
          </div>

          <!-- CATEGORY + QUESTION -->

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>

              <mat-select [(ngModel)]="categoryId" (selectionChange)="categoryChanged()">
                <mat-option *ngFor="let c of categories" [value]="c.id">
                  {{ c.name }}
                </mat-option>

                <mat-option [value]="-1"> + Create New Category </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              *ngIf="categoryId && categoryId > 0 && categoryId !== CREATE_NEW_ID"
            >
              <mat-label>Subcategory</mat-label>

              <mat-select [(ngModel)]="subcategoryId" (selectionChange)="subcategoryChanged()">
                <mat-option [value]="null">No subcategory</mat-option>
                <mat-option *ngFor="let s of subcategories" [value]="s.id">
                  {{ s.name }}
                </mat-option>
                <mat-option [value]="CREATE_NEW_ID">+ Create New Subcategory</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              *ngIf="
                categoryId && categoryId > 0 && categoryId !== CREATE_NEW_ID && subcategoryReady
              "
            >
              <mat-label>Question</mat-label>

              <mat-select [(ngModel)]="questionId" (selectionChange)="questionChanged()">
                <mat-option *ngFor="let q of questions" [value]="q.id">
                  {{ q.question }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div
            *ngIf="subcategoryId === CREATE_NEW_ID && categoryId && categoryId > 0"
            class="new-category"
          >
            <mat-form-field appearance="outline">
              <mat-label>Subcategory Name</mat-label>
              <input matInput [(ngModel)]="newSubcategoryName" />
            </mat-form-field>
            <button mat-stroked-button (click)="createSubcategory()">Create Subcategory</button>
          </div>

          <!-- ========================= -->
          <!-- CREATE NEW CATEGORY -->
          <!-- ========================= -->

          <div *ngIf="newCategory" class="new-category">
            <mat-form-field appearance="outline">
              <mat-label>Category Name</mat-label>

              <input matInput [(ngModel)]="newCategoryName" />
            </mat-form-field>

            <button mat-stroked-button (click)="createCategory()">Create Category</button>
          </div>

          <!-- ========================= -->
          <!-- SELECTED QUESTION INFO -->
          <!-- ========================= -->

          <div class="question-info" *ngIf="selectedQuestion">
            <div>
              <small>Category</small>
              <b>{{ selectedQuestion.category.name }}</b>
            </div>

            <div>
              <small>Subcategory</small>
              <b>
                {{ selectedQuestion.subcategory?.name || '—' }}
              </b>
            </div>

            <div>
              <small>Question Source</small>
              <b>
                {{ selectedQuestion.questionSource || '—' }}
              </b>
            </div>

            <div>
              <small>Answer Source</small>
              <b *ngIf="!selectedQuestion.answerSourceUrl">
                {{ selectedQuestion.answerSource || '—' }}
              </b>
              <a
                *ngIf="selectedQuestion.answerSourceUrl"
                [href]="selectedQuestion.answerSourceUrl"
                target="_blank"
                rel="noopener"
              >
                {{ selectedQuestion.answerSource || 'Open' }}
              </a>
            </div>

            <div class="full">
              <small>Question</small>
              <b>{{ selectedQuestion.question }}</b>
            </div>
          </div>

          <!-- ========================= -->
          <!-- PERSONAL ANSWER -->
          <!-- ========================= -->

          <mat-form-field appearance="outline" class="full-width" *ngIf="selectedQuestion">
            <mat-label>My Answer / Notes</mat-label>

            <textarea matInput rows="10" [(ngModel)]="answer"></textarea>
          </mat-form-field>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button (click)="cancel()">Cancel</button>

          <button mat-flat-button [disabled]="!selectedQuestion || !answer.trim()" (click)="save()">
            Save Workspace Note
          </button>
        </mat-card-actions>
      </mat-card>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Search category</mat-label>
          <input matInput [(ngModel)]="filterCategory" (ngModelChange)="refreshNotesTable()" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Search subcategory</mat-label>
          <input matInput [(ngModel)]="filterSubcategory" (ngModelChange)="refreshNotesTable()" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Search question</mat-label>
          <input matInput [(ngModel)]="filterQuestion" (ngModelChange)="refreshNotesTable()" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Search answer</mat-label>
          <input matInput [(ngModel)]="filterAnswer" (ngModelChange)="refreshNotesTable()" />
        </mat-form-field>

        <button mat-button type="button" (click)="clearNoteFilters()">Clear</button>
      </div>

      <mat-card>
        <div class="table-wrap">
          <table
            mat-table
            [dataSource]="notesData"
            matSort
            matSortActive="updatedAt"
            matSortDirection="desc"
          >
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="category">Category</th>
              <td mat-cell *matCellDef="let n">{{ n.question.category.name }}</td>
            </ng-container>

            <ng-container matColumnDef="subcategory">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="subcategory">Subcategory</th>
              <td mat-cell *matCellDef="let n">{{ n.question.subcategory?.name || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="question">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="question">Question</th>
              <td mat-cell *matCellDef="let n" class="question-cell">{{ n.question.question }}</td>
            </ng-container>

            <ng-container matColumnDef="answer">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="answer">My Answer</th>
              <td mat-cell *matCellDef="let n" class="truncate">{{ n.answer }}</td>
            </ng-container>

            <ng-container matColumnDef="updatedAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="updatedAt">Updated At</th>
              <td mat-cell *matCellDef="let n">{{ n.updatedAt | date: 'dd MMM yyyy, h:mm a' : 'Asia/Kolkata' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let n">
                <button mat-icon-button title="View" (click)="view(n)">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button title="Edit" (click)="edit(n)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" title="Delete" (click)="remove(n)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="noteCols"></tr>
            <tr mat-row *matRowDef="let row; columns: noteCols"></tr>
          </table>

          <div class="empty" *ngIf="!allNotes.length">No workspace notes yet.</div>
          <div class="empty" *ngIf="allNotes.length && !notesData.data.length">
            No notes match your search.
          </div>
        </div>
      </mat-card>
    </div>
  `,

  styles: [
    `
      .question-search-block {
        margin-top: 8px;
      }

      .search-hint {
        margin: -4px 0 8px;
        color: #6b7280;
        font-size: 13px;
      }

      .question-search-results {
        list-style: none;
        margin: 0 0 16px;
        padding: 0;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        max-height: 280px;
        overflow: auto;
        background: #fff;
      }

      .search-result-btn {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        width: 100%;
        padding: 12px 14px;
        border: none;
        border-bottom: 1px solid #f1f5f9;
        background: transparent;
        text-align: left;
        cursor: pointer;
      }

      .search-result-btn:hover {
        background: #f8fafc;
      }

      .question-search-results li:last-child .search-result-btn {
        border-bottom: none;
      }

      .search-result-meta {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: #64748b;
      }

      .search-result-text {
        font-size: 14px;
        color: #111827;
        line-height: 1.4;
      }

      .browse-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 8px 0 4px;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .browse-divider mat-divider {
        flex: 1;
      }

      .bulk-intro {
        margin: 0 0 16px;
        color: #6b7280;
        font-size: 14px;
      }

      .bulk-rows {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 16px;
      }

      .bulk-row {
        padding: 14px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        background: #fafbfc;
      }

      .bulk-row-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .bulk-row-num {
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
      }

      .bulk-row-question {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
        padding: 10px 12px;
        background: #fff;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .bulk-row-question small {
        display: block;
        color: #64748b;
        margin-bottom: 4px;
      }

      .bulk-row-question strong {
        display: block;
        line-height: 1.4;
      }

      .bulk-results {
        margin-bottom: 10px;
      }
    `,
  ],
})
export class NotesComponent implements AfterViewInit {
  private api = inject(ApiService);

  private dialog = inject(MatDialog);

  private toast = inject(ToastService);

  @ViewChild(MatSort) sort?: MatSort;

  readonly CREATE_NEW_ID = CREATE_NEW_ID;

  noteCols = ['category', 'subcategory', 'question', 'answer', 'updatedAt', 'actions'];

  notesData = new MatTableDataSource<Note>([]);

  allNotes: Note[] = [];

  filterCategory = '';

  filterSubcategory = '';

  filterQuestion = '';

  filterAnswer = '';

  categories: Category[] = [];

  subcategories: Subcategory[] = [];

  questions: Question[] = [];

  editing?: Note | { id?: number };

  categoryId?: number;

  subcategoryId?: number | null;

  questionId?: number;

  subcategoryReady = false;

  selectedQuestion?: Question;

  answer = '';

  newCategory = false;

  newCategoryName = '';

  newSubcategoryName = '';

  questionSearch = '';

  questionSearchResults: Question[] = [];

  questionSearchLoading = false;

  bulkEditing = false;

  bulkRows: BulkNoteRow[] = [];

  bulkSaving = false;

  private bulkSearchTimers = new Map<number, ReturnType<typeof setTimeout>>();

  private questionSearchInput = new Subject<string>();

  private questionSearchSub = this.questionSearchInput.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((term) => {
      const q = term.trim();
      if (q.length < 2) {
        return of(null);
      }
      this.questionSearchLoading = true;
      return this.api.questions({
        page: 0,
        size: 25,
        search: q,
        sort: 'question,asc',
      });
    }),
  );

  ngOnInit() {
    this.load();

    this.questionSearchSub.subscribe({
      next: (page) => {
        if (page === null) {
          this.questionSearchResults = [];
          this.questionSearchLoading = false;
          return;
        }
        this.questionSearchResults = page.content;
        this.questionSearchLoading = false;
      },
      error: () => {
        this.questionSearchLoading = false;
        this.questionSearchResults = [];
      },
    });
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.notesData.sort = this.sort;
    }

    this.notesData.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'category':
          return item.question.category.name.toLowerCase();
        case 'subcategory':
          return (item.question.subcategory?.name ?? '').toLowerCase();
        case 'question':
          return item.question.question.toLowerCase();
        case 'answer':
          return item.answer.toLowerCase();
        case 'updatedAt':
          return item.updatedAt;
        default:
          return '';
      }
    };
  }

  load() {
    this.api.categories().subscribe((c) => {
      this.categories = c;
    });

    this.api.notes(0, 1000).subscribe((p) => {
      this.allNotes = p.content;
      this.refreshNotesTable();
    });
  }

  refreshNotesTable(): void {
    const match = (filter: string, value: string) => {
      const q = filter.trim().toLowerCase();
      if (!q) {
        return true;
      }
      return value.toLowerCase().includes(q);
    };

    this.notesData.data = this.allNotes.filter(
      (n) =>
        match(this.filterCategory, n.question.category.name) &&
        match(this.filterSubcategory, n.question.subcategory?.name ?? '') &&
        match(this.filterQuestion, n.question.question) &&
        match(this.filterAnswer, n.answer),
    );
  }

  clearNoteFilters(): void {
    this.filterCategory = '';
    this.filterSubcategory = '';
    this.filterQuestion = '';
    this.filterAnswer = '';
    this.refreshNotesTable();
  }

  get bulkReadyCount(): number {
    return this.bulkRows.filter((r) => r.question && r.answer.trim()).length;
  }

  startBulk(): void {
    this.editing = undefined;
    this.bulkEditing = true;
    this.bulkRows = [this.newBulkRow(), this.newBulkRow(), this.newBulkRow()];
  }

  cancelBulk(): void {
    this.bulkEditing = false;
    this.bulkRows = [];
    this.bulkSaving = false;
  }

  private newBulkRow(): BulkNoteRow {
    return { question: undefined, answer: '', search: '', results: [] };
  }

  addBulkRow(): void {
    this.bulkRows = [...this.bulkRows, this.newBulkRow()];
  }

  removeBulkRow(index: number): void {
    if (this.bulkRows.length <= 1) {
      return;
    }
    clearTimeout(this.bulkSearchTimers.get(index));
    this.bulkSearchTimers.delete(index);
    this.bulkRows = this.bulkRows.filter((_, i) => i !== index);
  }

  onBulkRowSearch(index: number, term: string): void {
    this.bulkRows[index].search = term;
    clearTimeout(this.bulkSearchTimers.get(index));
    this.bulkSearchTimers.set(
      index,
      setTimeout(() => {
        const q = term.trim();
        if (q.length < 2) {
          this.bulkRows[index].results = [];
          return;
        }
        this.api
          .questions({ page: 0, size: 15, search: q, sort: 'question,asc' })
          .subscribe((page) => {
            this.bulkRows[index].results = page.content;
          });
      }, 300),
    );
  }

  pickBulkQuestion(index: number, q: Question): void {
    this.bulkRows[index].question = q;
    this.bulkRows[index].search = '';
    this.bulkRows[index].results = [];
    const existing = this.allNotes.find((n) => n.question.id === q.id);
    if (existing && !this.bulkRows[index].answer.trim()) {
      this.bulkRows[index].answer = existing.answer;
    }
  }

  clearBulkQuestion(index: number): void {
    this.bulkRows[index].question = undefined;
    this.bulkRows[index].search = '';
    this.bulkRows[index].results = [];
  }

  saveBulk(): void {
    const items = this.bulkRows
      .filter((r) => r.question && r.answer.trim())
      .map((r) => ({ questionId: r.question!.id, answer: r.answer.trim() }));

    if (!items.length) {
      return;
    }

    this.bulkSaving = true;
    this.api.bulkSaveNotes(items).subscribe({
      next: (res) => {
        this.bulkSaving = false;
        const parts = [];
        if (res.created) {
          parts.push(`${res.created} created`);
        }
        if (res.updated) {
          parts.push(`${res.updated} updated`);
        }
        if (res.skipped) {
          parts.push(`${res.skipped} skipped`);
        }
        this.toast.show(parts.length ? parts.join(', ') : 'Workspace notes saved');
        this.cancelBulk();
        this.load();
      },
      error: () => {
        this.bulkSaving = false;
        this.toast.show('Bulk save failed');
      },
    });
  }

  start() {
    this.bulkEditing = false;
    this.editing = {};

    this.categoryId = undefined;

    this.subcategoryId = undefined;

    this.questionId = undefined;

    this.selectedQuestion = undefined;

    this.answer = '';

    this.newCategory = false;

    this.newCategoryName = '';

    this.newSubcategoryName = '';

    this.subcategories = [];

    this.subcategoryReady = false;

    this.clearQuestionSearch();
  }

  clearQuestionSearch(): void {
    this.questionSearch = '';
    this.questionSearchResults = [];
    this.questionSearchLoading = false;
  }

  pickQuestionFromSearch(q: Question): void {
    this.categoryId = q.category.id;
    this.subcategoryId = q.subcategory?.id ?? null;
    this.questionId = q.id;
    this.selectedQuestion = q;

    const existing = this.allNotes.find((n) => n.question.id === q.id);
    if (existing && (!this.editing || !('id' in this.editing && this.editing.id))) {
      this.answer = existing.answer;
      this.editing = existing;
    } else if (!this.editing || !('id' in this.editing && this.editing.id)) {
      this.answer = existing?.answer ?? this.answer;
    }

    this.newCategory = false;
    this.subcategoryReady = true;

    this.api.subcategories(this.categoryId).subscribe((s) => {
      this.subcategories = s;
    });

    this.api
      .questions({
        page: 0,
        size: 100,
        categoryId: this.categoryId,
        subcategoryId: this.subcategoryId ?? undefined,
        sort: 'question,asc',
      })
      .subscribe((p) => {
        this.questions =
          this.subcategoryId === null ? p.content.filter((item) => !item.subcategory) : p.content;
      });

    this.clearQuestionSearch();
    this.toast.show('Question selected — add your answer and save');
  }

  cancel() {
    this.editing = undefined;
  }

  categoryChanged() {
    if (this.categoryId === -1) {
      this.newCategory = true;

      this.questions = [];

      this.selectedQuestion = undefined;

      this.questionId = undefined;

      return;
    }

    this.newCategory = false;

    this.subcategoryId = undefined;

    this.questionId = undefined;

    this.selectedQuestion = undefined;

    this.subcategoryReady = false;

    this.questions = [];

    if (this.categoryId && this.categoryId > 0) {
      this.api.subcategories(this.categoryId).subscribe((s) => {
        this.subcategories = s;
      });
    } else {
      this.subcategories = [];
    }
  }

  subcategoryChanged() {
    this.questionId = undefined;
    this.selectedQuestion = undefined;
    this.questions = [];

    if (this.subcategoryId === CREATE_NEW_ID) {
      this.subcategoryReady = false;
      return;
    }

    this.loadQuestionsForSelection();
  }

  private loadQuestionsForSelection() {
    if (!this.categoryId || this.categoryId <= 0) {
      return;
    }

    this.subcategoryReady = true;

    this.api
      .questions({
        page: 0,
        size: 100,
        categoryId: this.categoryId,
        subcategoryId: this.subcategoryId ?? undefined,
        sort: 'question,asc',
      })
      .subscribe((p) => {
        this.questions =
          this.subcategoryId === null ? p.content.filter((q) => !q.subcategory) : p.content;
      });
  }

  createSubcategory() {
    const name = this.newSubcategoryName.trim();
    if (!name || !this.categoryId || this.categoryId <= 0) {
      return;
    }

    this.api.createSubcategory(this.categoryId, name).subscribe((s) => {
      this.subcategories = [...this.subcategories, s];
      this.subcategoryId = s.id;
      this.newSubcategoryName = '';
      this.toast.show('Subcategory created');
      this.loadQuestionsForSelection();
    });
  }

  questionChanged() {
    this.selectedQuestion = this.questions.find((q) => q.id === this.questionId);
  }

  createCategory() {
    const name = this.newCategoryName.trim();

    if (!name) {
      return;
    }

    this.api.createCategory(name).subscribe((c) => {
      this.categories = [...this.categories, c];

      this.categoryId = c.id;

      this.newCategory = false;

      this.newCategoryName = '';

      this.categoryChanged();

      this.toast.show('Category created');
    });
  }

  save() {
    if (!this.selectedQuestion) {
      return;
    }

    const request =
      this.editing && 'id' in this.editing && this.editing.id
        ? this.api.updateNote(this.editing.id, this.selectedQuestion.id, this.answer)
        : this.api.createNote(this.selectedQuestion.id, this.answer);

    request.subscribe(() => {
      this.toast.show('Workspace note saved');

      this.editing = undefined;

      this.load();
    });
  }

  edit(n: Note) {
    this.bulkEditing = false;
    this.editing = n;

    this.clearQuestionSearch();

    this.categoryId = n.question.category.id;

    this.subcategoryId = n.question.subcategory?.id ?? null;

    this.questionId = n.question.id;

    this.answer = n.answer;

    this.api.subcategories(this.categoryId).subscribe((s) => {
      this.subcategories = s;
      this.subcategoryReady = true;
      this.loadQuestionsForSelection();
      this.selectedQuestion = n.question;
    });
  }

  view(n: Note) {
    alert(
      `Question:

${n.question.question}

My Answer / Notes:

${n.answer}`,
    );
  }

  remove(n: Note) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Workspace Note?',
          message: 'This will permanently delete your personal note.',
          confirmText: 'Delete',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }

        this.api.deleteNote(n.id).subscribe(() => {
          this.allNotes = this.allNotes.filter((x) => x.id !== n.id);
          this.refreshNotesTable();

          this.toast.show('Workspace note deleted');
        });
      });
  }
}
