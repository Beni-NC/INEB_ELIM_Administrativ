/**
 * Datos de contacto y enlaces institucionales (lo no traducible). Un único sitio: el footer, el
 * dock flotante y la sección de padres los leen de aquí.
 */
export const CONTACT = Object.freeze({
  /** Número de WhatsApp del responsable, en formato internacional sin "+", como exige wa.me. */
  whatsappNumber: '34643340453',
  whatsappDisplay: '+34 643 340 453',
  /**
   * Crédito del footer (el logo de INEB). Apunta al perfil de LinkedIn del desarrollador
   * mientras no haya web oficial: mejor un enlace que lleva a algo real que uno que no resuelve.
   */
  partnerUrl: 'https://www.linkedin.com/in/natanael-beniamin-cioarba/',
});

/** Enlace wa.me al responsable, con el texto ya escrito (el usuario solo tiene que enviarlo). */
export function whatsappUrl(text: string): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
