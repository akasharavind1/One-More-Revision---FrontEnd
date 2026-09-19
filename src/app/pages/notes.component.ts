import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
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
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';

import { ApiService } from '../core/api.service';
import { Category, Question, Note, Subcategory } from '../core/models';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { ToastService } from '../shared/toast.service';
import { CREATE_NEW_ID } from '../shared/question-edit-dialog.component';

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
          <button mat-flat-button (click)="start()">
            <mat-icon>add</mat-icon>
            Create Workspace Note
          </button>
        </div>
      </div>

      <!-- ========================= -->
      <!-- CREATE / EDIT FORM -->
      <!-- ========================= -->

      <mat-card class="editor" *ngIf="editing">
        <mat-card-header>
          <mat-card-title>
            {{ editing.id ? 'Edit' : 'Create' }}
            Workspace Note
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
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

  ngOnInit() {
    this.load();
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

  start() {
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
    this.editing = n;

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
