import { Brain } from "lucide-react";
import type { LifeArea } from "./definitions";

/**
 * Grupo especial de tareas para vaciar la cabeza: todo lo que ronda por la
 * mente se guarda con este `area_id` y se muestra también en Planificación.
 */
export const RUIDO_MENTAL_AREA_ID = "ruido-mental";
export const RUIDO_MENTAL_NAME = "Ruido Mental";

export const RUIDO_MENTAL_AREA: LifeArea = {
  id: RUIDO_MENTAL_AREA_ID,
  name: RUIDO_MENTAL_NAME,
  description: "Pensamientos y tareas sueltas para sacarlas de la cabeza",
  icon: Brain,
};

export function isRuidoMentalArea(areaId?: string | null): boolean {
  return areaId === RUIDO_MENTAL_AREA_ID;
}
