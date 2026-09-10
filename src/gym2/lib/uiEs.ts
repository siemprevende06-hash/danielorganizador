/* Spanish translations for UI labels */

export const EQ_ES: Record<string, string> = {
  "body weight": "peso corporal",
  "barbell": "barra",
  "dumbbell": "mancuerna",
  "kettlebell": "peso ruso",
  "cable": "polea",
  "band": "banda",
  "machine": "máquina",
  "ez barbell": "barra EZ",
  "olympic barbell": "barra olímpica",
  "medicine ball": "balón",
  "stability ball": "pelota de estabilidad",
  "bosu ball": "bosu",
  "leverage machine": "máquina",
  "elliptical machine": "elíptica",
  "treadmill": "caminadora",
  "stepmill machine": "escaladora",
  "weighted": "con peso",
  "assisted": "asistido",
  "hammer": "martillo",
  "rope": "cuerda",
  "wheel roller": "rueda abdominal",
};

export const BP_ES: Record<string, string> = {
  "chest": "pecho",
  "back": "espalda",
  "shoulders": "hombros",
  "upper arms": "brazos",
  "lower arms": "antebrazos",
  "waist": "cintura",
  "upper legs": "muslos",
  "lower legs": "piernas",
  "cardio": "cardio",
};

export const TG_ES: Record<string, string> = {
  "pectorals": "pectoral",
  "lats": "dorsales",
  "delts": "deltoides",
  "biceps": "bíceps",
  "triceps": "tríceps",
  "forearms": "antebrazos",
  "abs": "abdomen",
  "glutes": "glúteos",
  "quads": "cuádriceps",
  "quadriceps": "cuádriceps",
  "hamstrings": "isquiotibiales",
  "calves": "pantorrillas",
  "spine": "columna",
  "upper back": "espalda alta",
  "lower back": "espalda baja",
  "cardiovascular system": "sistema cardiovascular",
  "traps": "trapecios",
  "neck": "cuello",
  "hips": "caderas",
  "inner thigh": "aductores",
  "adductors": "aductores",
  "abductors": "abductores",
};

export const eqEs = (eq: string): string => EQ_ES[eq] || eq;
export const bpEs = (bp: string): string => BP_ES[bp] || bp;
export const tgEs = (tg: string): string => TG_ES[tg] || tg;
