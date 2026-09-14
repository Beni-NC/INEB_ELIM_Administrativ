/**
 * FICHERO GENERADO — no editar a mano. Lo escribe scripts/generate-version.mjs en postinstall,
 * prestart y prebuild. Para cambiar el número visible, edita "version" en package.json.
 */
export interface AppVersion {
  /** Semver manual de package.json: lo que ve el usuario. */
  readonly release: string;
  /** Número de commits de la rama: contador automático y monótono. */
  readonly build: number;
  /** Hash corto del commit publicado. */
  readonly commit: string;
  /** true si se compiló con cambios sin commitear. */
  readonly dirty: boolean;
  /** Fecha de compilación (ISO 8601). */
  readonly builtAt: string;
}

export const APP_VERSION: AppVersion = {
  release: '2.8.0',
  build: 87,
  commit: '953e65f',
  dirty: true,
  builtAt: '2026-09-14T12:38:51.094Z',
};
