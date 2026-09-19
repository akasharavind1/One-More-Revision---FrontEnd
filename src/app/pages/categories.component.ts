import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../core/api.service';
import { Category } from '../core/models';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { ToastService } from '../shared/toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule],
  template: `<div class="page">
    <div class="page-head">
      <div>
        <h1>Categories</h1>
        <p>Manage categories used to organize your question bank.</p>
      </div>
    </div>
    <mat-card
      ><div class="table-wrap">
        <table mat-table [dataSource]="categories">
          <ng-container matColumnDef="name"
            ><th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let c">{{ c.name }}</td></ng-container
          ><ng-container matColumnDef="subcategories"
            ><th mat-header-cell *matHeaderCellDef>Subcategories</th>
            <td mat-cell *matCellDef="let c">
              {{ (c.subcategories || []).join(', ') || '—' }}
            </td></ng-container
          ><ng-container matColumnDef="count"
            ><th mat-header-cell *matHeaderCellDef>Number of Questions</th>
            <td mat-cell *matCellDef="let c">{{ c.questionCount }}</td></ng-container
          ><ng-container matColumnDef="created"
            ><th mat-header-cell *matHeaderCellDef>Created Date</th>
            <td mat-cell *matCellDef="let c">
              {{ c.createdAt | date: 'dd MMM yyyy' : 'Asia/Kolkata' }}
            </td></ng-container
          ><ng-container matColumnDef="actions"
            ><th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let c">
              <button mat-icon-button (click)="rename(c)"><mat-icon>edit</mat-icon></button
              ><button mat-icon-button color="warn" (click)="remove(c)">
                <mat-icon>delete</mat-icon>
              </button>
            </td></ng-container
          >
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
        <div class="empty" *ngIf="!categories.length">No categories yet.</div>
      </div></mat-card
    >
  </div>`,
})
export class CategoriesComponent {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  categories: Category[] = [];
  cols = ['name', 'subcategories', 'count', 'created', 'actions'];
  ngOnInit() {
    this.load();
  }
  load() {
    this.api.categories().subscribe((c) => (this.categories = c));
  }
  rename(c: Category) {
    const name = prompt('Rename category', c.name);
    if (!name || name === c.name) return;
    this.api.updateCategory(c.id, name).subscribe((x) => {
      Object.assign(c, x);
      this.toast.show('Category renamed');
    });
  }
  remove(c: Category) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Category?',
          message: c.questionCount
            ? `Cannot delete ${c.name} while ${c.questionCount} questions depend on it.`
            : `Delete ${c.name}?`,
          confirmText: 'Delete',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok && c.questionCount === 0)
          this.api.deleteCategory(c.id).subscribe(
            () => {
              this.categories = this.categories.filter((x) => x.id !== c.id);
              this.toast.show('Category deleted');
            },
            (e) => this.toast.show(e?.error?.message || 'Could not delete category'),
          );
      });
  }
}
