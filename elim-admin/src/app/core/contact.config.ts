/**
 * Datos de contacto y enlaces institucionales (lo no traducible). Un único sitio: el footer, el
 * dock flotante y la sección de padres los leen de aquí.
 */
export const CONTACT = Object.freeze({
  /** Número de WhatsApp del responsable, en formato internacional sin "+", como exige wa.me. */
  whatsappNumber: '34643340453',
  whatsappDisplay: '+34 643 340 453',
  /** Web del desarrollador (crédito del footer). */
  partnerUrl: 'https://ineb.es',
});

/** Enlace wa.me al responsable, con el texto ya escrito (el usuario solo tiene que enviarlo). */
export function whatsappUrl(text: string): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
