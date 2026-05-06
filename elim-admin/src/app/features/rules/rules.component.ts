import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface RuleSection {
  tone: 'primary' | 'success' | 'info' | 'warn';
  num: number;
  icon: string;
  eyebrow: string;
  title: string;
  items: string[];
}

@Component({
  selector: 'app-rules',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, TranslateModule],
  template: `
    <div class="rules-hero">
      <div class="rules-hero-icon">
        <span class="material-symbols-rounded">menu_book</span>
      </div>
      <div class="rules-hero-text">
        <h2 class="rules-hero-title">{{ 'rules.title' | translate }}</h2>
        <p class="rules-hero-sub">{{ 'rules.subtitle' | translate }}</p>
      </div>
    </div>

    <div class="rules-meta-row">
      <div class="rules-meta-pill">
        <span class="material-symbols-rounded">workspaces</span>
        {{ 'rules.sections_count' | translate: { count: sections().length } }}
      </div>
      <div class="rules-meta-pill">
        <span class="material-symbols-rounded">checklist_rtl</span>
        {{ 'rules.rules_to_apply' | translate }}
      </div>
      <div class="rules-meta-pill">
        <span class="material-symbols-rounded">groups</span>
        {{ 'rules.for_all_teams' | translate }}
      </div>
    </div>

    <div class="rules-grid">
      @for (s of sections(); track s.num) {
        <mat-card class="rule-card-pro" appearance="outlined">
          <div class="rule-card-head" [attr.data-tone]="s.tone">
            <div class="rule-card-num">{{ s.num }}</div>
            <div class="rule-card-icon">
              <span class="material-symbols-rounded">{{ s.icon }}</span>
            </div>
            <div class="rule-card-title-block">
              <span class="rule-card-eyebrow">{{ s.eyebrow }}</span>
              <h3 class="rule-card-title">{{ s.title }}</h3>
            </div>
          </div>
          <div class="rule-card-body">
            <ol class="rule-steps">
              @for (item of s.items; track $index) {
                <li>
                  <span class="rule-step-num">{{ $index + 1 }}</span>
                  <span class="rule-step-text">{{ item }}</span>
                </li>
              }
            </ol>
          </div>
        </mat-card>
      }
    </div>
  `,
})
export class RulesComponent {
  private readonly translate = inject(TranslateService);
  private readonly langChange = toSignal(this.translate.onLangChange, { initialValue: null });

  readonly sections = computed<RuleSection[]>(() => {
    // depend on language changes
    void this.langChange();
    const t = (k: string) => this.translate.instant(k) as string;
    const arr = (k: string): string[] => {
      const v = this.translate.instant(k);
      return Array.isArray(v) ? (v as string[]) : [];
    };
    return [
      { tone: 'primary', num: 1, icon: 'person',            eyebrow: t('rules.section_role'),         title: t('rules.coordinator_role'),         items: arr('rules.items.coordinator_role') },
      { tone: 'success', num: 2, icon: 'checklist',         eyebrow: t('rules.section_organization'), title: t('rules.coordinator_organization'), items: arr('rules.items.coordinator_organization') },
      { tone: 'info',    num: 3, icon: 'schedule',          eyebrow: t('rules.section_before'),       title: t('rules.before_program'),           items: arr('rules.items.before_program') },
      { tone: 'warn',    num: 4, icon: 'cleaning_services', eyebrow: t('rules.section_after'),        title: t('rules.after_program'),            items: arr('rules.items.after_program') },
      { tone: 'primary', num: 5, icon: 'family_restroom',   eyebrow: t('rules.section_parents'),      title: t('rules.parents_role'),             items: arr('rules.items.parents_role') },
    ];
  });
}
