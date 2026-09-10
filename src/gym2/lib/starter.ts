import { uid } from "./format";
import type { ExConfig, Routine } from "./types";

const SPEC: [string, string, [string, number, number][]][] = [
  ["Push Day", "barbell", [["0025", 4, 8], ["0047", 3, 10], ["0426", 3, 10], ["0334", 3, 12], ["0241", 3, 12], ["0251", 3, 10]]],
  ["Pull Day", "pullup", [["2330", 4, 10], ["0027", 4, 8], ["1323", 3, 10], ["0031", 3, 10], ["0313", 3, 12]]],
  ["Leg Day", "legs", [["0043", 4, 8], ["0085", 3, 10], ["0739", 3, 12], ["0585", 3, 12], ["0586", 3, 12], ["0605", 4, 15]]],
];

export const starterRoutines = (): Routine[] =>
  SPEC.map(([name, emoji, list]) => ({
    id: uid(),
    name,
    emoji,
    ex: list.map(([id, sets, reps]) => ({ id, sets, reps, weight: 0 })),
  }));

/* ============================ Rutina DUP de Daniel ============================
 * Fuerza: política lineal — reps 6-8, peso sube al completar todas las series.
 * Hipertrofia: política doble — rango de reps (repsMin…reps) al mismo peso.
 * Codificamos prog por rutina y por ejercicio (los de tiempo necesitan "time").
 * */
type DUPEx = [id: string, sets: number, reps: number, repsMin?: number, prog?: string];
const DANIEL_SPEC: [string, string, string, DUPEx[]][] = [
  [
    "Lunes — Torso Fuerza",
    "barbell",
    "linear",
    [
      ["0025", 4, 8, 6], // Press banca
      ["0652", 4, 8, 6], // Dominadas
      ["0861", 4, 8, 6], // Remo sentado con polea
      ["0405", 3, 8, 6], // Press militar mancuernas
      ["0334", 3, 15, 12], // Elevaciones laterales
      ["0031", 3, 12, 10], // Curl bíceps
      ["0241", 3, 12, 10], // Extensión tríceps polea
      ["2135", 3, 60, 60, "time"], // Plancha
    ],
  ],
  [
    "Martes — Piernas Hipertrofia",
    "legs",
    "double",
    [
      ["0043", 4, 12, 10], // Sentadilla
      ["0085", 3, 12, 10], // Peso muerto rumano
      ["0739", 3, 15, 12], // Prensa de piernas
      ["0586", 3, 15, 12], // Curl femoral
      ["0605", 3, 20, 15], // Gemelos
    ],
  ],
  [
    "Jueves — Torso Hipertrofia",
    "dumbbell",
    "double",
    [
      ["0025", 4, 12, 10], // Press banca
      ["0652", 4, 12, 10], // Dominadas
      ["0861", 4, 12, 10], // Remo
      ["0405", 3, 12, 10], // Press militar
      ["0334", 3, 20, 15], // Elevaciones laterales
      ["0031", 3, 15, 12], // Curl bíceps
      ["0241", 3, 15, 12], // Extensión tríceps
      ["2135", 3, 60, 60, "time"], // Plancha
    ],
  ],
  [
    "Viernes — Piernas Fuerza",
    "pullup",
    "linear",
    [
      ["0043", 4, 8, 5], // Sentadilla
      ["0085", 3, 8, 6], // Peso muerto rumano
      ["0739", 3, 10, 8], // Prensa de piernas
      ["0586", 3, 10, 8], // Curl femoral
      ["0605", 3, 15, 12], // Gemelos
    ],
  ],
];

export const danielRoutines = (): Routine[] =>
  DANIEL_SPEC.map(([name, emoji, prog, list]) => ({
    id: uid(),
    name,
    emoji,
    prog,
    ex: list.map(([id, sets, reps, mins, p]) => {
      const cfg: ExConfig = { id, sets, reps, weight: 0 };
      if (p === "time") {
        cfg.mode = "time";
        cfg.sec = reps;
        cfg.prog = "time";
        cfg.bodyweight = true;
        delete cfg.reps;
        delete cfg.repsMin;
      } else {
        cfg.repsMin = mins;
        if (prog === "double") cfg.prog = "double";
      }
      return cfg;
    }),
  }));