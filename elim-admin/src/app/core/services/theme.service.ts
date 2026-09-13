import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'app.theme';
/** Color de la barra del navegador/PWA por tema (= `--c-surface` de tokens.css). */
const THEME_COLOR: Record<AppTheme, string> = { light: '#ffffff', dark: '#181d26' };

/**
 * Tema visual. Es **manual**: la app arranca siempre en claro salvo que el usuario haya elegido
 * oscuro en este dispositivo (se guarda en localStorage). No se sigue la preferencia del sistema:
 * el usuario quiere que el modo oscuro solo se active si él lo ha pedido.
 *
 * `index.html` aplica el tema guardado con un script inline antes del primer pintado para que no
 * haya un destello claro; este servicio solo mantiene la señal y el atributo sincronizados.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly current = signal<AppTheme>(readStored() ?? 'light');

  init(): void {
    this.apply(this.current());
  }

  toggle(): void {
    this.set(this.current() === 'dark' ? 'light' : 'dark');
  }

  set(theme: AppTheme): void {
    this.current.set(theme);
    this.apply(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* sin almacenamiento: solo dura la sesión */ }
  }

  private apply(theme: AppTheme): void {
    document.documentElement.dataset['theme'] = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  }
}

function readStored(): AppTheme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch { return null; }
}
