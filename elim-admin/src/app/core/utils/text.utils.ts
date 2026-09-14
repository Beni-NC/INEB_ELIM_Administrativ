/**
 * Normaliza texto para buscar: minúsculas y sin diacríticos, de modo que "birle" encuentre
 * "Bîrle" y "mitoseriu" encuentre "Mitoșeriu" (en el teclado del móvil casi nadie escribe las
 * tildes rumanas). También unifica la ş/ţ con cedilla y la ș/ț con coma, que conviven en los datos.
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
