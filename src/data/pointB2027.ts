import type { PointBArea } from "@/lib/definitions"

export const POINT_B_AREAS: PointBArea[] = [
  {
    id: "salud",
    label: "Salud y Bienestar",
    group: "cimientos",
    icon: "🩺",
    effortTrackingIds: ["gym", "sueno", "alimentacion", "agua", "suplementos", "control-estres"],
    sub: [
      { id: "gym", label: "Gym", start: 51, target: 65, unit: "kg", trackingIds: ["gym"] },
      { id: "sueno", label: "Sueño", start: 6.5, target: 8, unit: "horas", trackingIds: ["sueno"] },
      { id: "alimentacion", label: "Alimentación", start: 3, target: 8, unit: "/10", trackingIds: ["alimentacion"] },
      { id: "agua", label: "Agua / Hidratación", start: 3, target: 8, unit: "/10", trackingIds: ["agua"] },
      { id: "suplementos", label: "Suplementos", start: 3, target: 8, unit: "/10", trackingIds: ["suplementos"] },
      { id: "control-estres", label: "Control de Estrés", start: 3, target: 8, unit: "/10", trackingIds: ["control-estres"] },
    ],
  },
  {
    id: "fuerza-mental",
    label: "Fuerza Mental",
    group: "cimientos",
    icon: "🧠",
    effortTrackingIds: ["rutina-activacion", "rutina-desactivacion", "alistamiento-desayuno", "planificacion", "no-porn", "no-fap"],
    sub: [
      {
        id: "rutinas", label: "Rutinas", start: 0, target: 100, unit: "%", trackingIds: [],
        children: [
          { id: "rutina-activacion", label: "Rutina de Activación", start: 50, target: 85, unit: "%", trackingIds: ["rutina-activacion"] },
          { id: "rutina-desactivacion", label: "Rutina de Desactivación", start: 50, target: 85, unit: "%", trackingIds: ["rutina-desactivacion"] },
          { id: "alistamiento-desayuno", label: "Alistamiento y Desayuno", start: 50, target: 85, unit: "%", trackingIds: ["alistamiento-desayuno"] },
        ],
      },
      {
        id: "habitos", label: "Hábitos", start: 0, target: 100, unit: "%", trackingIds: [],
        children: [
          { id: "planificacion", label: "Planificación Diaria", start: 50, target: 85, unit: "%", trackingIds: ["planificacion"] },
        ],
      },
      {
        id: "detox-dopaminico", label: "Detox Dopamínico", start: 0, target: 100, unit: "%", trackingIds: [],
        children: [
          { id: "no-porn", label: "No Porn", start: 0, target: 100, unit: "días", trackingIds: ["no-porn"] },
          { id: "no-fap", label: "No Fap", start: 0, target: 100, unit: "días", trackingIds: ["no-fap"] },
        ],
      },
    ],
  },
  {
    id: "proposito",
    label: "Propósito y Autoconocimiento",
    group: "cimientos",
    icon: "🎯",
    effortTrackingIds: ["vision", "valores", "journaling", "revisiones"],
    sub: [
      { id: "vision", label: "Visión / Dirección", start: 5, target: 9, unit: "/10", trackingIds: ["vision"] },
      { id: "valores", label: "Valores / Identidad", start: 5, target: 9, unit: "/10", trackingIds: ["valores"] },
      { id: "journaling", label: "Journaling", start: 3, target: 8, unit: "/10", trackingIds: ["journaling"] },
      { id: "revisiones", label: "Revisiones", start: 6, target: 9, unit: "/10", trackingIds: ["revisiones"] },
    ],
  },
  {
    id: "apariencia",
    label: "Apariencia y Entorno",
    group: "cimientos",
    icon: "✨",
    effortTrackingIds: ["skincare_am", "skincare_pm"],
    sub: [
      { id: "skincare-am", label: "Skincare AM", start: 6, target: 9, unit: "/10", trackingIds: ["skincare-am"] },
      { id: "skincare-pm", label: "Skincare PM", start: 6, target: 9, unit: "/10", trackingIds: ["skincare-pm"] },
      { id: "barbero", label: "Barbero / Estética", start: 4, target: 8, unit: "/10", trackingIds: ["barbero"] },
      { id: "vestimenta", label: "Vestimenta", start: 3, target: 8, unit: "/10", trackingIds: ["vestimenta"] },
      { id: "orden", label: "Orden del espacio", start: 4, target: 8, unit: "/10", trackingIds: ["orden"] },
      { id: "higiene", label: "Higiene / Bañarme", start: 8, target: 10, unit: "/10", trackingIds: ["higiene"] },
    ],
  },
  {
    id: "desarrollo",
    label: "Desarrollo Personal",
    group: "construccion",
    icon: "📚",
    effortTrackingIds: ["lectura", "idiomas", "piano", "guitarra"],
    sub: [
      { id: "lectura", label: "Lectura", start: 0, target: 24, unit: "libros/año", trackingIds: ["lectura"] },
      { id: "ingles", label: "Inglés", start: 3, target: 6, unit: "/10 (B2)", trackingIds: ["ingles"] },
      { id: "italiano", label: "Italiano", start: 2, target: 4, unit: "/10 (A2)", trackingIds: ["italiano"] },
      { id: "piano", label: "Piano", start: 5, target: 10, unit: "canciones", trackingIds: ["piano"] },
      { id: "guitarra", label: "Guitarra", start: 5, target: 10, unit: "canciones", trackingIds: ["guitarra"] },
      { id: "habilidades", label: "Habilidades técnicas", start: 5, target: 8, unit: "/10", trackingIds: ["habilidades"] },
      { id: "ajedrez", label: "Ajedrez", start: 0, target: 100, unit: "partidas/año", trackingIds: ["ajedrez"] },
    ],
  },
  {
    id: "profesional",
    label: "Profesional / Académico",
    group: "construccion",
    icon: "💼",
    effortTrackingIds: ["universidad", "emprendimiento", "proyectos"],
    sub: [
      { id: "universidad", label: "Universidad", start: 3, target: 6, unit: "/10", trackingIds: ["universidad"] },
      { id: "siemprevende", label: "SiempreVende", start: 0, target: 250, unit: "$/mes", trackingIds: ["siemprevende"] },
      { id: "autec", label: "AUTEC", start: 0, target: 1, unit: "registrada + generando", trackingIds: ["autec"] },
      { id: "proyectos", label: "Proyectos", start: 3, target: 7, unit: "/10", trackingIds: ["proyectos"] },
      { id: "experiencia", label: "Experiencia laboral", start: 3, target: 6, unit: "/10", trackingIds: ["experiencia"] },
      { id: "networking", label: "Networking profesional", start: 2, target: 6, unit: "/10", trackingIds: ["networking"] },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    group: "construccion",
    icon: "💰",
    effortTrackingIds: ["finanzas"],
    sub: [
      { id: "ingresos", label: "Ingresos", start: 0, target: 250, unit: "$/mes", trackingIds: ["ingresos"] },
      { id: "gastos", label: "Control de gastos", start: 6, target: 9, unit: "/10", trackingIds: ["gastos"] },
      { id: "ahorro", label: "Ahorro", start: 80, target: 200, unit: "$ USD", trackingIds: ["ahorro"] },
      { id: "inversion", label: "Inversión", start: 1, target: 5, unit: "/10", trackingIds: ["inversion"] },
      { id: "edu-financiera", label: "Educación financiera", start: 7, target: 9, unit: "/10", trackingIds: ["edu-financiera"] },
    ],
  },
  {
    id: "familia",
    label: "Familia y Amistad",
    group: "recompensas",
    icon: "👨‍👩‍👧‍👦",
    effortTrackingIds: ["familia", "amistades", "eventos_sociales"],
    sub: [
      { id: "familia", label: "Familia", start: 6, target: 9, unit: "/10", trackingIds: ["familia"] },
      { id: "amistades", label: "Amistades profundas", start: 1, target: 3, unit: "personas", trackingIds: ["amistades"] },
      { id: "red-social", label: "Red social / Eventos", start: 2, target: 6, unit: "/10", trackingIds: ["red-social"] },
      { id: "experiencias-grupales", label: "Experiencias grupales", start: 0, target: 6, unit: "/10", trackingIds: ["experiencias-grupales"] },
    ],
  },
  {
    id: "amor",
    label: "Amor y Romance",
    group: "recompensas",
    icon: "❤️",
    effortTrackingIds: ["seduccion", "conexion", "intimidad_tracking", "habilidades-sociales"],
    sub: [
      { id: "seduccion", label: "Seducción / Acción", start: 0, target: 10, unit: "citas/año", trackingIds: ["seduccion"] },
      { id: "conexion", label: "Conexión emocional", start: 1, target: 6, unit: "/10", trackingIds: ["conexion"] },
      { id: "intimidad", label: "Intimidad / Sexo", start: 1, target: 7, unit: "/10", trackingIds: ["intimidad_tracking"] },
      { id: "experiencia-romantica", label: "Experiencia romántica", start: 1, target: 5, unit: "/10", trackingIds: ["experiencia-romantica"] },
      { id: "habilidades-sociales", label: "Habilidades sociales", start: 4, target: 7, unit: "/10", trackingIds: ["habilidades-sociales"] },
    ],
  },
  {
    id: "ocio",
    label: "Ocio, Recreación y Experiencias",
    group: "recompensas",
    icon: "🎮",
    effortTrackingIds: ["ajedrez", "dibujo"],
    sub: [
      { id: "ajedrez-ocio", label: "Ajedrez", start: 0, target: 100, unit: "partidas/año", trackingIds: ["ajedrez"] },
      { id: "gaming", label: "Gaming", start: 3, target: 7, unit: "/10 (control)", trackingIds: ["gaming"] },
      { id: "dibujo", label: "Dibujo", start: 1, target: 6, unit: "/10", trackingIds: ["dibujo"] },
      { id: "tiempo-libre", label: "Tiempo libre", start: 3, target: 7, unit: "/10", trackingIds: ["tiempo-libre"] },
      { id: "experiencias", label: "Experiencias nuevas", start: 1, target: 6, unit: "/10", trackingIds: ["experiencias"] },
      { id: "viajes", label: "Viajes", start: 0, target: 1, unit: "viaje/año", trackingIds: ["viajes"] },
    ],
  },
]

export const VISION_3_YEARS = `Mi visión a 3 años (2029):

- Graduado de Ingeniería Automática, trabajando en tecnología mientras construyo AUTEC
- AUTEC como negocio estable, generando ingresos recurrentes
- Viviendo en Cuba con opción de mudarme cuando decida
- Físicamente fuerte: 70kg+, gym 5d/sem, presencia imponente
- Inglés C1, Italiano B2, viajando ocasionalmente
- Hombre con experiencia en relaciones, seguro de sí mismo
- Red de contactos sólida en tecnología y emprendimiento
- Económicamente libre: inversiones, ahorros, ingresos múltiples`

export function getAreaById(id: string) {
  return POINT_B_AREAS.find(a => a.id === id)
}

export function getAreasByGroup(group: string) {
  return POINT_B_AREAS.filter(a => a.group === group)
}
