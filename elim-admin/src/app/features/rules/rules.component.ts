import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ContactCardComponent } from '../../shared/ui/contact-card/contact-card.component';

interface RuleSection {
  id: string;
  icon: string;
  title: string;
  items: string[];
}

/** Reguli: cinco secciones de texto (desde i18n) en formato documento, índice de anclas y bloque de contacto al final. */
@Component({
    selector: 'app-rules',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslatePipe, ContactCardComponent],
    template: `
    <section class="ui-section">
      <div class="ui-card">
        <header class="ui-card__header">
          <h2 class="ui-card__title">{{ 'rules.title' | translate }}</h2>
          <span class="ui-count">{{ sections().length }}</span>
        </header>
        <p class="ui-card__desc">{{ 'rules.subtitle' | translate }}</p>
        <nav class="ui-chip-group ui-card__body" [attr.aria-label]="'rules.index' | translate">
          @for (s of sections(); track s.id; let i = $index) {
            <button type="button" class="ui-chip" (click)="scrollTo(s.id)">
              <span class="rules__num">{{ i + 1 }}</span>{{ s.title }}
            </button>
          }
        </nav>
      </div>

      <div class="ui-columns-2">
        @for (s of sections(); track s.id; let i = $index) {
          <article class="ui-card" [id]="'rule-' + s.id">
            <header class="ui-card__header">
              <span class="icon faint" aria-hidden="true">{{ s.icon }}</span>
              <h3 class="ui-card__title rules__title"><span class="rules__num">{{ i + 1 }}</span>{{ s.title }}</h3>
            </header>
            <ol class="ui-card__body rules__list">
              @for (item of s.items; track $index) {
                <li class="rules__item">
                  <span class="rules__marker num">{{ $index + 1 }}.</span>
                  <span>{{ item }}</span>
                </li>
              }
            </ol>
          </article>
        }
      </div>
    </section>

    <!-- Contacto y distribución de la app: al final de la guía, donde surgen las dudas. -->
    <app-contact-card />
  `,
    styles: [`
    :host { display: flex; flex-direction: column; gap: var(--sp-4); }
    .rules__num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: var(--r-sm);
      background: var(--c-primary-soft);
      color: var(--c-primary);
      font-size: var(--fs-xs);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .rules__title { display: flex; align-items: center; gap: var(--sp-2); }
    .rules__list { display: flex; flex-direction: column; gap: var(--sp-2); }
    .rules__item { display: flex; gap: var(--sp-2); line-height: 1.5; }
    .rules__marker { color: var(--c-text-3); flex-shrink: 0; min-width: 18px; text-align: right; }
  `]
})
export class RulesComponent {
  private readonly translate = inject(TranslateService);
  private readonly langChange = toSignal(this.translate.onLangChange, { initialValue: null });

  /**
   * Índice por scroll en vez de `href="#id"`: con `<base href="/INEB_ELIM_Administrativ/">` un
   * enlace de solo fragmento se resuelve contra la base y saca al usuario de la pestaña.
   */
  scrollTo(id: string): void {
    document.getElementById('rule-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  readonly sections = computed<RuleSection[]>(() => {
    void this.langChange(); // recalcula al cambiar de idioma
    const t = (k: string) => this.translate.instant(k) as string;
    const arr = (k: string): string[] => {
      const v = this.translate.instant(k);
      return Array.isArray(v) ? (v as string[]) : [];
    };
    return [
      { id: 'role',         icon: 'star',              title: t('rules.coordinator_role'),         items: arr('rules.items.coordinator_role') },
      { id: 'organization', icon: 'checklist',         title: t('rules.coordinator_organization'), items: arr('rules.items.coordinator_organization') },
      { id: 'before',       icon: 'schedule',          title: t('rules.before_program'),           items: arr('rules.items.before_program') },
      { id: 'after',        icon: 'cleaning_services', title: t('rules.after_program'),            items: arr('rules.items.after_program') },
      { id: 'parents',      icon: 'family_restroom',   title: t('rules.parents_role'),             items: arr('rules.items.parents_role') },
    ];
  });
}
