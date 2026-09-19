import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const LOADER_LABELS = [
  'Loading your question bank…',
  'Syncing categories and subcategories…',
  'Fetching your workspace notes…',
  'Updating study progress…',
  'Preparing your dashboard…',
  'Saving your changes securely…',
  'Validating import data…',
  'Connecting to the server…',
  'Refreshing your session…',
  'Organizing questions for review…',
  'Loading practice counts and sources…',
  'Almost ready — one more revision.',
];

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private active = 0;
  private readonly loadingSubject = new BehaviorSubject(false);
  private readonly messageSubject = new BehaviorSubject('');

  readonly loading$ = this.loadingSubject.asObservable();
  readonly message$ = this.messageSubject.asObservable();

  start(): void {
    if (this.active === 0) {
      this.messageSubject.next(LOADER_LABELS[Math.floor(Math.random() * LOADER_LABELS.length)]);
    }
    this.active++;
    this.loadingSubject.next(true);
  }

  end(): void {
    this.active = Math.max(0, this.active - 1);
    if (this.active === 0) {
      this.loadingSubject.next(false);
    }
  }
}
