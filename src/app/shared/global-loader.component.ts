import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (loading.loading$ | async) {
      <div class="global-loader-backdrop" role="status" aria-live="polite" aria-busy="true">
        <div class="global-loader-card">
          <div class="global-loader-spinner" aria-hidden="true"></div>
          <p class="global-loader-kicker">Working on it</p>
          <p class="global-loader-label">{{ loading.message$ | async }}</p>
        </div>
      </div>
    }
  `,
  styles: `
    .global-loader-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      padding: 24px;
    }

    .global-loader-card {
      max-width: 360px;
      width: 100%;
      padding: 28px 24px;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
      text-align: center;
    }

    .global-loader-spinner {
      width: 44px;
      height: 44px;
      margin: 0 auto 16px;
      border: 4px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: global-loader-spin 0.75s linear infinite;
    }

    .global-loader-kicker {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #64748b;
    }

    .global-loader-label {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      line-height: 1.45;
      color: #0f172a;
    }

    @keyframes global-loader-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class GlobalLoaderComponent {
  readonly loading = inject(LoadingService);
}
