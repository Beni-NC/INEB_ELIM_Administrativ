import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { TeamsComponent } from './teams.component';
import { MyTeamService } from '../../core/services/my-team.service';
import { NavigationService } from '../../core/services/navigation.service';
import { testProviders } from '../../../testing/test-providers';

describe('TeamsComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: testProviders() });
  });

  async function render() {
    const fixture = TestBed.createComponent(TeamsComponent);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('lista los equipos activos con su coordinador y marca los que no tienen turno', async () => {
    const { el } = await render();
    const rows = el.querySelectorAll('.team > .ui-row');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Ionescu Ion');
    // Ambos tienen programación futura en el fixture: ningún aviso ámbar.
    expect(el.querySelectorAll('.team .ui-badge--warning').length).toBe(0);
  });

  it('expandir una fila muestra el detalle y escribe el fragmento de la URL', async () => {
    const { fixture, el } = await render();
    const btn = el.querySelector<HTMLButtonElement>('.team .ui-row__btn')!;
    btn.click();
    await fixture.whenStable();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('#detail-team-1')).not.toBeNull();
    expect(TestBed.inject(NavigationService).expandedTeam()).toBe('Echipa 1');
    expect(TestBed.inject(Router).parseUrl(TestBed.inject(Router).url).fragment).toBe('team:Echipa 1');
    btn.click();
    await fixture.whenStable();
    expect(el.querySelector('#detail-team-1')).toBeNull();
  });

  it('el marcador "echipa mea" se guarda en el dispositivo y se puede quitar', async () => {
    const { fixture, el } = await render();
    const mark = el.querySelectorAll<HTMLButtonElement>('.team__mine')[1];
    mark.click();
    await fixture.whenStable();
    expect(TestBed.inject(MyTeamService).team()).toBe('Echipa 2');
    expect(localStorage.getItem('app.team')).toBe('Echipa 2');
    expect(mark.getAttribute('aria-pressed')).toBe('true');
    mark.click();
    await fixture.whenStable();
    expect(TestBed.inject(MyTeamService).team()).toBeNull();
    expect(localStorage.getItem('app.team')).toBeNull();
  });
});
