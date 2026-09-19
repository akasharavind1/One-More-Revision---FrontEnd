import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Category, Question, Subcategory } from '../core/models';
import { ApiService } from '../core/api.service';
import { switchMap, of } from 'rxjs';

export const CREATE_NEW_ID = -1;

export interface QuestionEditDialogData {
  mode: 'create' | 'edit';
  question?: Question;
  categories: Category[];
}

export interface QuestionEditResult {
  categoryId: number;
  subcategoryId: number | null;
  question: string;
  questionSource: string;
  questionSourceUrl: string;
  answerSource: string;
  answerSourceUrl: string;
  studiedBefore: boolean;
  practiceCount: number;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title class="edit-title">
      <mat-icon>{{ data.mode === 'create' ? 'add' : 'edit' }}</mat-icon>
      {{ data.mode === 'create' ? 'Add Question' : 'Edit Question' }}
    </h2>

    <mat-dialog-content class="edit-content">
      <div class="section-title">
        <mat-icon>description</mat-icon>
        Question Information
      </div>

      <div class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="form.categoryId" (selectionChange)="categoryChanged()">
            <mat-option *ngFor="let category of categories" [value]="category.id">
              {{ category.name }}
            </mat-option>
            <mat-option [value]="CREATE_NEW_ID">+ Create new category</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="new-taxonomy-panel full-width" *ngIf="form.categoryId === CREATE_NEW_ID">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>New category name</mat-label>
            <input matInput [(ngModel)]="newCategoryName" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>New subcategory name</mat-label>
            <input matInput [(ngModel)]="newSubcategoryName" placeholder="Optional" />
          </mat-form-field>
        </div>

        <ng-container *ngIf="form.categoryId && form.categoryId !== CREATE_NEW_ID">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Subcategory</mat-label>
            <mat-select [(ngModel)]="form.subcategoryId">
              <mat-option [value]="null">No subcategory</mat-option>
              <mat-option *ngFor="let subcategory of subcategories" [value]="subcategory.id">
                {{ subcategory.name }}
              </mat-option>
              <mat-option [value]="CREATE_NEW_ID">+ Create new subcategory</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            class="full-width"
            *ngIf="form.subcategoryId === CREATE_NEW_ID"
          >
            <mat-label>New subcategory name</mat-label>
            <input matInput [(ngModel)]="newSubcategoryName" />
          </mat-form-field>
        </ng-container>

        <div class="toggle-field">
          <div>
            <div class="field-label">Studied Before</div>
            <div class="field-description">Mark whether you have studied this question before.</div>
          </div>
          <mat-slide-toggle [(ngModel)]="form.studiedBefore"></mat-slide-toggle>
        </div>
      </div>

      <div class="section-title">
        <mat-icon>help_outline</mat-icon>
        Question
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Question</mat-label>
        <textarea
          matInput
          rows="3"
          [(ngModel)]="form.question"
          placeholder="Enter the interview question"
        ></textarea>
      </mat-form-field>

      <div class="section-title">
        <mat-icon>link</mat-icon>
        Sources
      </div>

      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Question Source</mat-label>
          <input
            matInput
            [(ngModel)]="form.questionSource"
            placeholder="Interview / LeetCode / etc."
          />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Question Source URL</mat-label>
          <input matInput [(ngModel)]="form.questionSourceUrl" placeholder="https://..." />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Answer Source label</mat-label>
          <input matInput [(ngModel)]="form.answerSource" placeholder="Docs / video title / etc." />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Answer Source URL</mat-label>
          <input matInput [(ngModel)]="form.answerSourceUrl" placeholder="https://..." />
        </mat-form-field>
      </div>

      <ng-container *ngIf="data.mode === 'edit'">
        <div class="section-title">
          <mat-icon>fitness_center</mat-icon>
          Practice
        </div>

        <div class="practice-section">
          <div class="practice-current">
            <span class="practice-label">Current Practice Count</span>
            <strong>{{ form.practiceCount }}</strong>
          </div>
          <button
            mat-stroked-button
            type="button"
            class="reset-button"
            [disabled]="form.practiceCount === 0"
            (click)="resetPracticeCount()"
          >
            <mat-icon>restart_alt</mat-icon>
            Reset Practice Count
          </button>
        </div>
      </ng-container>

      <div class="validation-error" *ngIf="validationMessage">
        <mat-icon>error_outline</mat-icon>
        {{ validationMessage }}
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="edit-actions">
      <button mat-button type="button" (click)="cancel()">Cancel</button>
      <button
        mat-flat-button
        type="button"
        class="save-button"
        [disabled]="saving"
        (click)="save()"
      >
        <mat-icon>{{ data.mode === 'create' ? 'add' : 'save' }}</mat-icon>
        {{ data.mode === 'create' ? 'Add Question' : 'Save Changes' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class QuestionEditDialogComponent {
  readonly CREATE_NEW_ID = CREATE_NEW_ID;

  categories: Category[];

  subcategories: Subcategory[] = [];

  validationMessage = '';

  saving = false;

  newCategoryName = '';

  newSubcategoryName = '';

  form: QuestionEditResult;

  constructor(
    private api: ApiService,
    private dialogRef: MatDialogRef<QuestionEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuestionEditDialogData,
  ) {
    this.categories = [...data.categories];

    if (data.mode === 'edit' && data.question) {
      const q = data.question;
      this.form = {
        categoryId: q.category.id,
        subcategoryId: q.subcategory?.id ?? null,
        question: q.question,
        questionSource: q.questionSource ?? '',
        questionSourceUrl: q.questionSourceUrl ?? '',
        answerSource: q.answerSource ?? '',
        answerSourceUrl: q.answerSourceUrl ?? '',
        studiedBefore: q.studiedBefore,
        practiceCount: q.practiceCount,
      };
      this.loadSubcategories();
    } else {
      this.form = {
        categoryId: this.categories[0]?.id ?? CREATE_NEW_ID,
        subcategoryId: null,
        question: '',
        questionSource: '',
        questionSourceUrl: '',
        answerSource: '',
        answerSourceUrl: '',
        studiedBefore: false,
        practiceCount: 0,
      };
      if (this.form.categoryId > 0) {
        this.loadSubcategories();
      }
    }
  }

  private loadSubcategories(): void {
    if (!this.form.categoryId || this.form.categoryId === CREATE_NEW_ID) {
      this.subcategories = [];
      return;
    }

    this.api.subcategories(this.form.categoryId).subscribe({
      next: (subcategories: Subcategory[]) => {
        this.subcategories = subcategories;
        if (
          this.form.subcategoryId &&
          this.form.subcategoryId !== CREATE_NEW_ID &&
          !this.subcategories.some((s) => s.id === this.form.subcategoryId)
        ) {
          this.form.subcategoryId = null;
        }
      },
      error: () => {
        this.subcategories = [];
        this.form.subcategoryId = null;
      },
    });
  }

  categoryChanged(): void {
    if (this.form.categoryId === CREATE_NEW_ID) {
      this.form.subcategoryId = null;
      this.subcategories = [];
      return;
    }

    this.newCategoryName = '';
    this.newSubcategoryName = '';
    this.form.subcategoryId = null;
    this.loadSubcategories();
  }

  resetPracticeCount(): void {
    this.form.practiceCount = 0;
  }

  save(): void {
    this.validationMessage = '';

    if (!this.form.question.trim()) {
      this.validationMessage = 'Question is required.';
      return;
    }

    if (this.form.categoryId === CREATE_NEW_ID && !this.newCategoryName.trim()) {
      this.validationMessage = 'New category name is required.';
      return;
    }

    if (
      this.form.categoryId !== CREATE_NEW_ID &&
      this.form.subcategoryId === CREATE_NEW_ID &&
      !this.newSubcategoryName.trim()
    ) {
      this.validationMessage = 'New subcategory name is required.';
      return;
    }

    if (this.form.practiceCount < 0) {
      this.form.practiceCount = 0;
    }

    this.saving = true;

    const creatingCategory = this.form.categoryId === CREATE_NEW_ID;

    const resolveCategory$ = creatingCategory
      ? this.api.createCategory(this.newCategoryName.trim())
      : of({ id: this.form.categoryId } as Category);

    resolveCategory$
      .pipe(
        switchMap((category) => {
          this.form.categoryId = category.id;
          if (!this.categories.some((c) => c.id === category.id)) {
            this.categories = [...this.categories, category];
          }

          const subName = this.newSubcategoryName.trim();
          const needsNewSub =
            subName && (creatingCategory || this.form.subcategoryId === CREATE_NEW_ID);

          if (needsNewSub) {
            return this.api.createSubcategory(category.id, subName).pipe(
              switchMap((sub) => {
                this.form.subcategoryId = sub.id;
                return of(this.buildResult());
              }),
            );
          }

          if (creatingCategory) {
            this.form.subcategoryId = null;
          }

          return of(this.buildResult());
        }),
      )
      .subscribe({
        next: (result) => {
          this.saving = false;
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.saving = false;
          this.validationMessage = error?.error?.message || 'Could not save question.';
        },
      });
  }

  private buildResult(): QuestionEditResult {
    return {
      ...this.form,
      question: this.form.question.trim(),
      questionSource: this.form.questionSource.trim(),
      questionSourceUrl: this.form.questionSourceUrl.trim(),
      answerSource: this.form.answerSource.trim(),
      answerSourceUrl: this.form.answerSourceUrl.trim(),
    };
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
