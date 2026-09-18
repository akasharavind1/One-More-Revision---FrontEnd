import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { User } from './models';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private key = 'ikt_token';
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  token() {
    return localStorage.getItem(this.key);
  }
  isLoggedIn() {
    return !!this.token();
  }
  login(username: string, password: string) {
    return this.http
      .post<{ token: string; user: User }>('/api/auth/login', { username, password })
      .pipe(
        tap((r) => {
          localStorage.setItem(this.key, r.token);
          this.userSubject.next(r.user);
        }),
      );
  }
  loadMe() {
    if (!this.isLoggedIn()) return;
    this.http
      .get<User>('/api/auth/me')
      .subscribe({ next: (u) => this.userSubject.next(u), error: () => this.logout(false) });
  }
  logout(redirect = true) {
    localStorage.removeItem(this.key);
    this.userSubject.next(null);
    if (redirect) this.router.navigateByUrl('/login');
  }
}
