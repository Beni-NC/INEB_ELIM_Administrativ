import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { NavigationService } from './navigation.service';
import { testProviders } from '../../../testing/test-providers';

describe('NavigationService — navegación cruzada y enlaces profundos', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  it('goTo navega a la pestaña de la entidad, la expande y la deja en el fragmento', async () => {
    const harness = await RouterTestingHarness.create('/');
    const nav = TestBed.inject(NavigationService);
    nav.goTo('youth', 'y-dan');
    await harness.fixture.whenStable();
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/tineri#youth:y-dan');
    expect(nav.expandedYouthId()).toBe('y-dan');
  });

  it('llegar con un fragmento expande la entidad correspondiente', async () => {
    await RouterTestingHarness.create('/echipe#team:Echipa%202');
    expect(TestBed.inject(NavigationService).expandedTeam()).toBe('Echipa 2');
  });

  it('el fragmento de la rotación no toca ninguna entidad', async () => {
    await RouterTestingHarness.create('/#rotation');
    const nav = TestBed.inject(NavigationService);
    expect(nav.expandedTeam()).toBeNull();
    expect(nav.expandedYouthId()).toBeNull();
  });
});
