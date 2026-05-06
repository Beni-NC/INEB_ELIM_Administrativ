import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NavTarget } from '../models';
import { TAB_PATHS } from '../constants';

/**
 * Coordinates cross-tab navigation: clicking a related entity (e.g. a coordinator
 * inside a schedule card) routes to its tab and auto-expands the relevant card.
 *
 * Pending scroll/highlight timers are cancelled on every new request so that
 * rapid clicks cannot stack work on the main thread (a previous source of jank).
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);

  readonly expandedTeam = signal<string | null>(null);
  readonly expandedYouthId = signal<string | null>(null);
  readonly expandedParentId = signal<string | null>(null);
  /** Pending historical team key to scroll to in TeamsComponent (e.g. "Echipa 4-1745712000000"). */
  readonly expandedHistoryKey = signal<string | null>(null);

  private scrollTimer: ReturnType<typeof setTimeout> | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private lastFlashedEl: HTMLElement | null = null;

  goTo(target: NavTarget, id: string, ev?: Event): void {
    ev?.stopPropagation();
    const path = target === 'team' ? TAB_PATHS.teams
      : target === 'youth' ? TAB_PATHS.youths
        : TAB_PATHS.parents;

    if (target === 'team') this.expandedTeam.set(id);
    else if (target === 'youth') this.expandedYouthId.set(id);
    else this.expandedParentId.set(id);

    this.cancelPending();

    const url = '/' + path;
    const alreadyThere = this.router.url.split('?')[0].split('#')[0] === url;
    const navPromise = alreadyThere
      ? Promise.resolve(true)
      : this.router.navigateByUrl(url);

    navPromise.then(ok => { if (ok) this.scheduleScrollToCard(target, id); });
  }

  /**
   * Navigate to the Echipe tab and scroll to a specific historical composition
   * card identified by its history key (`${teamName}-${endTimeMs}`).
   */
  goToHistoricalTeam(historyKey: string, ev?: Event): void {
    ev?.stopPropagation();
    this.expandedHistoryKey.set(historyKey);
    this.cancelPending();
    const url = '/' + TAB_PATHS.teams;
    const alreadyThere = this.router.url.split('?')[0].split('#')[0] === url;
    const navPromise = alreadyThere
      ? Promise.resolve(true)
      : this.router.navigateByUrl(url);
    navPromise.then(ok => {
      if (!ok) return;
      this.scrollTimer = setTimeout(() => {
        this.scrollTimer = null;
        const el = document.getElementById('card-team-history-' + historyKey);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (this.lastFlashedEl && this.lastFlashedEl !== el) {
            this.lastFlashedEl.classList.remove('flash-highlight');
          }
          el.classList.add('flash-highlight');
          this.lastFlashedEl = el;
          this.flashTimer = setTimeout(() => {
            this.flashTimer = null;
            el.classList.remove('flash-highlight');
            if (this.lastFlashedEl === el) this.lastFlashedEl = null;
          }, 1600);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 260);
    });
  }

  private scheduleScrollToCard(target: NavTarget, id: string): void {
    this.scrollTimer = setTimeout(() => {
      this.scrollTimer = null;
      const el = document.getElementById(`card-${target}-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (this.lastFlashedEl && this.lastFlashedEl !== el) {
          this.lastFlashedEl.classList.remove('flash-highlight');
        }
        el.classList.add('flash-highlight');
        this.lastFlashedEl = el;
        this.flashTimer = setTimeout(() => {
          this.flashTimer = null;
          el.classList.remove('flash-highlight');
          if (this.lastFlashedEl === el) this.lastFlashedEl = null;
        }, 1600);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 220);
  }

  private cancelPending(): void {
    if (this.scrollTimer !== null) { clearTimeout(this.scrollTimer); this.scrollTimer = null; }
    if (this.flashTimer !== null) { clearTimeout(this.flashTimer); this.flashTimer = null; }
    if (this.lastFlashedEl) {
      this.lastFlashedEl.classList.remove('flash-highlight');
      this.lastFlashedEl = null;
    }
  }

  /** Pulls the pending expansion for `target` and clears it (one-shot consumption). */
  consumeExpanded(target: NavTarget): string | null {
    const sig = target === 'team' ? this.expandedTeam
      : target === 'youth' ? this.expandedYouthId
        : this.expandedParentId;
    const v = sig();
    sig.set(null);
    return v;
  }

  /** Pulls the pending historical-team key and clears it. */
  consumeHistoryKey(): string | null {
    const v = this.expandedHistoryKey();
    this.expandedHistoryKey.set(null);
    return v;
  }

  setExpandedTeam(name: string | null) { this.expandedTeam.set(name); }
  setExpandedYouth(id: string | null) { this.expandedYouthId.set(id); }
  setExpandedParent(id: string | null) { this.expandedParentId.set(id); }
}
