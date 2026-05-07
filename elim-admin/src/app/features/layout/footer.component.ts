import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DataService } from '../../core/services/data.service';
import { APP_VERSION } from '../../../version';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-logos-left">
          <img src="assets/logo-elim.png" alt="Logo Biserica ELIM" class="footer-logo footer-logo-elim">
          <img src="assets/logo_admin-trans-192.png" alt="Logo Departament Administrativ" class="footer-logo">
        </div>
        <div class="footer-text">
          <p>{{ 'footer.church' | translate }} &copy; {{ year }}</p>
          <p class="footer-sub">{{ 'footer.department' | translate }} <span class="app-version">{{ version }}</span></p>
        </div>
        <img src="assets/logo-ineb.png" alt="Logo INEB" class="footer-logo footer-logo-ineb">
      </div>
    </footer>
  `,
  styles: [`
    .app-version {
      font-size: 0.7em;
      opacity: 0.5;
      margin-left: 8px;
      font-weight: normal;
    }
  `]
})
export class FooterComponent {
  readonly year = inject(DataService).today.getFullYear();
  readonly version = APP_VERSION;
}
