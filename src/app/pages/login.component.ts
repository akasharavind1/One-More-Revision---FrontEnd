import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/auth.service';
@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `<div class="login-page">
    <mat-card class="login-card"
      ><div class="login-logo">OMR</div>
      <h1>One More Revision</h1>
      <p class="muted">
        Organize your preparation. Track what you studied. Practice with confidence.
      </p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline"
          ><mat-label>Email / Username</mat-label
          ><input matInput formControlName="username" autocomplete="username" /></mat-form-field
        ><mat-form-field appearance="outline"
          ><mat-label>Password</mat-label
          ><input
            matInput
            type="password"
            formControlName="password"
            autocomplete="current-password"
        /></mat-form-field>
        <div class="error" *ngIf="error">{{ error }}</div>
        <button mat-flat-button class="login-btn" [disabled]="form.invalid || loading">
          {{ loading ? 'Signing in…' : 'Login' }}
        </button>
      </form>
      <div class="demo">
        Development login: <b>admin&#64;example.com</b> / <b>ChangeMe123!</b>
      </div></mat-card
    >
  </div>`,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  form = this.fb.nonNullable.group({
    username: ['admin@example.com', Validators.required],
    password: ['ChangeMe123!', Validators.required],
  });
  loading = false;
  error = '';
  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.value.username!, this.form.value.password!).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message || 'Login failed';
      },
    });
  }
}
