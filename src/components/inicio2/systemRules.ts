/**
 * Regla visible de cada tarjeta de la pestaña Sistemas de Inicio 2.0.
 * Responde en una línea a "¿de qué se trata este sistema?" y se muestra en un
 * recuadro destacado dentro de la tarjeta.
 *
 * Las claves son tanto ids de tarjetas agrupadas (systemGroups.ts) como ids de
 * sistemas individuales (planSystems.ts).
 */
export const SYSTEM_CARD_RULE: Record<string, string> = {
  // Salud
  alimentacion: "Las 7 comidas del día.",
  sueno: "Horario regular: dormir de 9 pm a 5 am.",
  hidratacion: "Tomar agua durante todo el día.",
  gym: "Entrenamiento de hipertrofia de cada día.",
  suplementos: "Tomar la suplementación del día.",

  // Fuerza mental
  rutinas: "Cumplir las 3 rutinas: activación, alistamiento + desayuno y desactivación.",
  habitos: "Cumplir los 9 hábitos diarios del día.",
  detox: "Día limpio: sin porno, sin fap, sin videojuegos y sin redes sociales.",

  // Apariencia
  skincare: "Skin care en la mañana y en la noche.",
  "banarme-vestirme": "Bañarme y vestirme todos los días.",
  "orden-espacio": "Recoger cuarto, baño y sala; fregar los platos.",
  "barbero-estetica": "Corte y estética una vez al mes.",

  // Desarrollo
  lectura: "Lectura diaria de 15 a 30 minutos.",
  musica: "Práctica y aprendizaje de música, 15 a 30 minutos.",
  idiomas: "Práctica de la habilidad, 15 a 30 minutos.",
  ajedrez: "Aprendizaje con videos y una partida diaria.",
  game: "Aprendizaje con videos.",

  // Profesional
  universidad: "Bloques de tiempo de deep work / focus o bloque extra (80 a 240 min).",
  emprendimiento: "Bloques de tiempo de deep work / focus o bloque extra (80 a 240 min).",
  proyectos: "Bloques de tiempo de deep work / focus o bloque extra.",
  tareas: "Completar las tareas generales del periodo.",

  // Finanzas
  finanzas: "Control financiero diario de 15 minutos: ingresos, gastos y ahorro.",
};
