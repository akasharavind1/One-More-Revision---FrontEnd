import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../core/api.service';
import { ImportResult } from '../core/models';
import { ToastService } from '../shared/toast.service';
@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTableModule],
  template: `<div class="page">
    <div class="page-head">
      <div>
        <h1>Import Questions</h1>
        <p>Upload an .xlsx file, validate it, review the preview, then confirm the import.</p>
      </div>
    </div>
    <div
      class="upload-card"
      [class.dragging]="dragging"
      (dragover)="drag($event)"
      (dragleave)="dragging = false"
      (drop)="drop($event)"
    >
      <mat-icon>cloud_upload</mat-icon>
      <h2>Drop your Excel file here</h2>
      <p>or</p>
      <label class="browse"
        >Browse file<input type="file" accept=".xlsx" (change)="select($event)"
      /></label>
      <div *ngIf="file" class="selected">
        <b>{{ file.name }}</b
        ><span>{{ file.size | number }} bytes</span
        ><button mat-icon-button (click)="file = undefined; result = undefined">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <button mat-flat-button [disabled]="!file || loading" (click)="validate()">
        {{ loading ? 'Validating…' : 'Validate & Preview' }}
      </button>
    </div>
    <div *ngIf="result" class="preview">
      <div class="summary">
        <div>
          <span>Total rows</span><b>{{ result.totalRows }}</b>
        </div>
        <div>
          <span>Valid</span><b>{{ result.validRows }}</b>
        </div>
        <div>
          <span>Invalid</span><b>{{ result.invalidRows }}</b>
        </div>
        <div>
          <span>Duplicates</span><b>{{ result.duplicateRows }}</b>
        </div>
      </div>
      <div class="alert" *ngIf="!result.valid">
        <mat-icon>error</mat-icon>
        <div>
          <b>Import cannot be confirmed.</b>
          <div *ngFor="let e of result.errors">Row {{ e.row }}: {{ e.message }}</div>
        </div>
      </div>
      <div class="table-wrap">
        <table mat-table [dataSource]="result.preview">
          <ng-container matColumnDef="row"
            ><th mat-header-cell *matHeaderCellDef>Row</th>
            <td mat-cell *matCellDef="let r">{{ r.row }}</td></ng-container
          ><ng-container matColumnDef="category"
            ><th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let r">{{ r.category }}</td></ng-container
          ><ng-container matColumnDef="subcategory"
            ><th mat-header-cell *matHeaderCellDef>Subcategory</th>
            <td mat-cell *matCellDef="let r">{{ r.subcategory }}</td></ng-container
          ><ng-container matColumnDef="question"
            ><th mat-header-cell *matHeaderCellDef>Question</th>
            <td mat-cell *matCellDef="let r">{{ r.question }}</td></ng-container
          ><ng-container matColumnDef="source"
            ><th mat-header-cell *matHeaderCellDef>Question Source</th>
            <td mat-cell *matCellDef="let r">{{ r.questionSource }}</td></ng-container
          ><ng-container matColumnDef="url"
            ><th mat-header-cell *matHeaderCellDef>Source URL</th>
            <td mat-cell *matCellDef="let r">
              <a
                *ngIf="r.questionSourceUrl"
                [href]="r.questionSourceUrl"
                target="_blank"
                rel="noopener"
                >Open</a
              >
            </td></ng-container
          ><ng-container matColumnDef="status"
            ><th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let r">
              <span [class.ok]="r.valid" [class.bad]="!r.valid">{{
                r.valid ? 'Valid' : 'Invalid'
              }}</span>
              <div class="row-errors" *ngIf="!r.valid">{{ r.errors.join('; ') }}</div>
            </td></ng-container
          >
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      </div>
      <div class="actions">
        <button mat-button (click)="result = undefined">Cancel Import</button
        ><button mat-flat-button [disabled]="!result.valid || loading" (click)="confirm()">
          {{ loading ? 'Importing…' : 'Confirm & Import' }}
        </button>
      </div>
    </div>
  </div>`,
})
export class ImportComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  file?: File;
  result?: ImportResult;
  loading = false;
  dragging = false;
  cols = ['row', 'category', 'subcategory', 'question', 'source', 'url', 'status'];
  drag(e: DragEvent) {
    e.preventDefault();
    this.dragging = true;
  }
  drop(e: DragEvent) {
    e.preventDefault();
    this.dragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.file = f;
  }
  select(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.file = f;
  }
  validate() {
    if (!this.file) return;
    this.loading = true;
    this.api.validateImport(this.file).subscribe({
      next: (r) => {
        this.result = r;
        this.loading = false;
      },
      error: (e) => {
        this.toast.show(e?.error?.message || 'Validation failed');
        this.loading = false;
      },
    });
  }
  confirm() {
    if (!this.result?.importId) return;
    this.loading = true;
    this.api.confirmImport(this.result.importId).subscribe({
      next: (r) => {
        this.toast.show(`${r.imported} questions imported successfully`);
        this.result = undefined;
        this.file = undefined;
        this.loading = false;
      },
      error: (e) => {
        this.toast.show(e?.error?.message || 'Import failed');
        this.loading = false;
      },
    });
  }
}
