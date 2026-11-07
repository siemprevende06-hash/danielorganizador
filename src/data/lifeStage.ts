import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Línea base personal que ya se muestra en Punto de Partida.
 * Se centraliza aquí para que Punto de Partida y Alineación lean el mismo dato.
 */
export const LIFE_STAGE = {
  name: 'Daniel',
  age: 22,
  baselineDate: '2026-06-18',
  baselineLabel: format(new Date('2026-06-18T12:00:00'), "d 'de' MMMM yyyy", { locale: es }),
  city: 'La Habana, Cuba',
  pointBYear: 2027,
  visionYear: 2029,
  visionAge: 25,
} as const;
