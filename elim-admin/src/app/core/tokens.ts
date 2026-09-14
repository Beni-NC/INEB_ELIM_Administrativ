import { InjectionToken } from '@angular/core';
import { DomainData } from './models';

/**
 * Costuras de inyección para los tests de componente: por defecto la app usa la fecha real y
 * `DOMAIN_DATA`; un TestBed puede fijar "hoy" y un fixture de datos sin tocar los servicios.
 */
export const APP_TODAY = new InjectionToken<Date>('APP_TODAY');
export const APP_DATA = new InjectionToken<DomainData>('APP_DATA');
