import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { GlobalLoaderComponent } from './shared/global-loader.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GlobalLoaderComponent],
  template: `
    <app-global-loader />
    <router-outlet />
  `,
})
export class AppComponent {
  private auth = inject(AuthService);
  constructor() {
    this.auth.loadMe();
  }
}
