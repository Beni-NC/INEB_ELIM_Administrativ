import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './features/layout/header.component';
import { FooterComponent } from './features/layout/footer.component';
import { TabsNavComponent } from './features/layout/tabs-nav.component';
import { EventNotesDialogComponent } from './features/layout/event-notes-dialog.component';
import { PwaUpdateService } from './core/services/pwa-update.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, TabsNavComponent, EventNotesDialogComponent],
  template: `
    <app-header />
    <app-tabs-nav />
    <main class="main-content">
      <section class="section">
        <router-outlet />
      </section>
    </main>
    <app-footer />
    <app-event-notes-dialog />
  `,
})
export class AppComponent {
  constructor() {
    inject(PwaUpdateService).init();
  }
}
