import type { PointBArea } from "@/lib/definitions"

export const POINT_B_AREAS: PointBArea[] = [
  {
    id: "salud",
    label: "Salud y Bienestar",
    group: "cimientos",
    icon: "🩺",
    effortTrackingIds: ["gym", "boxeo"],
    sub: [
      { id: "nutricion", label: "Nutrición", start: 3, target: 8, unit: "/10", trackingIds: [] },
      { id: "ejercicio", label: "Ejercicio", start: 51, target: 65, unit: "kg", trackingIds: ["gym"] },
      { id: "boxeo", label: "Boxeo", start: 0, target: 80, unit: "% dominio", trackingIds: ["boxeo"] },
      { id: "sueno", label: "Sueño", start: 6.5, target: 8, unit: "horas", trackingIds: [] },
      { id: "energia", label: "Energía", start: 3, target: 7, unit: "/10", trackingIds: [] },
      { id: "agua", label: "Agua / Hidratación", start: 3, target: 8, unit: "/10", trackingIds: [] },
    ],
  },
  {
    id: "fuerza-mental",
    label: "Fuerza Mental",
    group: "cimientos",
    icon: "🧠",
    effortTrackingIds: [],
    sub: [
      { id: "rutina-activacion", label: "Rutina de Activación", start: 50, target: 85, unit: "%", trackingIds: [] },
      { id: "rutina-desactivacion", label: "Rutina de Desactivación", start: 50, target: 85, unit: "%", trackingIds: [] },
      { id: "mini-habitos", label: "Mini-hábitos", start: 50, target: 85, unit: "%", trackingIds: [] },
      { id: "detox", label: "Detox dopaminérgico", start: 3, target: 8, unit: "/10", trackingIds: [] },
      { id: "autocritica", label: "Autocrítica diaria", start: 8, target: 10, unit: "/10", trackingIds: [] },
      { id: "gaming-control", label: "Control de gaming", start: 3, target: 7, unit: "/10", trackingIds: [] },
    ],
  },
  {
    id: "proposito",
    label: "Propósito y Autoconocimiento",
    group: "cimientos",
    icon: "🎯",
    effortTrackingIds: [],
    sub: [
      { id: "vision", label: "Visión / Dirección", start: 5, target: 9, unit: "/10", trackingIds: [] },
      { id: "valores", label: "Valores / Identidad", start: 5, target: 9, unit: "/10", trackingIds: [] },
      { id: "journaling", label: "Journaling", start: 3, target: 8, unit: "/10", trackingIds: [] },
      { id: "revisiones", label: "Revisiones", start: 6, target: 9, unit: "/10", trackingIds: [] },
    ],
  },
  {
    id: "apariencia",
    label: "Apariencia y Entorno",
    group: "cimientos",
    icon: "✨",
    effortTrackingIds: ["skincare_am", "skincare_pm"],
    sub: [
      { id: "skincare-am", label: "Skincare AM", start: 6, target: 9, unit: "/10", trackingIds: ["skincare_am"] },
      { id: "skincare-pm", label: "Skincare PM", start: 6, target: 9, unit: "/10", trackingIds: ["skincare_pm"] },
      { id: "barbero", label: "Barbero / Estética", start: 4, target: 8, unit: "/10", trackingIds: [] },
      { id: "vestimenta", label: "Vestimenta", start: 3, target: 8, unit: "/10", trackingIds: [] },
      { id: "orden", label: "Orden del espacio", start: 4, target: 8, unit: "/10", trackingIds: [] },
      { id: "higiene", label: "Higiene / Bañarme", start: 8, target: 10, unit: "/10", trackingIds: [] },
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
      { id: "ingles", label: "Inglés", start: 3, target: 6, unit: "/10 (B2)", trackingIds: ["idiomas"] },
      { id: "italiano", label: "Italiano", start: 2, target: 4, unit: "/10 (A2)", trackingIds: ["idiomas"] },
      { id: "piano", label: "Piano", start: 5, target: 10, unit: "canciones", trackingIds: ["piano"] },
      { id: "guitarra", label: "Guitarra", start: 5, target: 10, unit: "canciones", trackingIds: ["guitarra"] },
      { id: "habilidades", label: "Habilidades técnicas", start: 5, target: 8, unit: "/10", trackingIds: [] },
      { id: "ajedrez", label: "Ajedrez (recreativo)", start: 0, target: 100, unit: "partidas/año", trackingIds: ["ajedrez"] },
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
      { id: "siemprevende", label: "SiempreVende", start: 0, target: 250, unit: "$/mes", trackingIds: ["emprendimiento"] },
      { id: "autec", label: "AUTEC", start: 0, target: 1, unit: "registrada + generando", trackingIds: ["emprendimiento"] },
      { id: "proyectos", label: "Proyectos", start: 3, target: 7, unit: "/10", trackingIds: ["proyectos"] },
      { id: "experiencia", label: "Experiencia laboral", start: 3, target: 6, unit: "/10", trackingIds: [] },
      { id: "networking", label: "Networking profesional", start: 2, target: 6, unit: "/10", trackingIds: [] },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    group: "construccion",
    icon: "💰",
    effortTrackingIds: ["finanzas"],
    sub: [
      { id: "ingresos", label: "Ingresos", start: 0, target: 250, unit: "$/mes", trackingIds: [] },
      { id: "gastos", label: "Control de gastos", start: 6, target: 9, unit: "/10", trackingIds: ["finanzas"] },
      { id: "ahorro", label: "Ahorro", start: 80, target: 200, unit: "$ USD", trackingIds: [] },
      { id: "inversion", label: "Inversión", start: 1, target: 5, unit: "/10", trackingIds: [] },
      { id: "edu-financiera", label: "Educación financiera", start: 7, target: 9, unit: "/10", trackingIds: [] },
    ],
  },
  {
    id: "familia",
    label: "Familia y Amistad",
    group: "recompensas",
    icon: "👨‍👩‍👧‍👦",
    effortTrackingIds: [],
    sub: [
      { id: "familia", label: "Familia", start: 6, target: 9, unit: "/10", trackingIds: [] },
      { id: "amistades", label: "Amistades profundas", start: 1, target: 3, unit: "personas", trackingIds: [] },
      { id: "red-social", label: "Red social / Eventos", start: 2, target: 6, unit: "/10", trackingIds: [] },
      { id: "experiencias-grupales", label: "Experiencias grupales", start: 0, target: 6, unit: "/10", trackingIds: ["eventos_sociales"] },
    ],
  },
  {
    id: "amor",
    label: "Amor y Romance",
    group: "recompensas",
    icon: "❤️",
    effortTrackingIds: [],
    sub: [
      { id: "seduccion", label: "Seducción / Acción", start: 0, target: 10, unit: "citas/año", trackingIds: [] },
      { id: "conexion", label: "Conexión emocional", start: 1, target: 6, unit: "/10", trackingIds: [] },
      { id: "intimidad", label: "Intimidad / Sexo", start: 1, target: 7, unit: "/10", trackingIds: ["intimidad_tracking"] },
      { id: "experiencia", label: "Experiencia romántica", start: 1, target: 5, unit: "/10", trackingIds: [] },
      { id: "habilidades-sociales", label: "Habilidades sociales", start: 4, target: 7, unit: "/10", trackingIds: [] },
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
      { id: "gaming", label: "Gaming", start: 3, target: 7, unit: "/10 (control)", trackingIds: [] },
      { id: "dibujo", label: "Dibujo", start: 1, target: 6, unit: "/10", trackingIds: ["dibujo"] },
      { id: "tiempo-libre", label: "Tiempo libre", start: 3, target: 7, unit: "/10", trackingIds: [] },
      { id: "experiencias", label: "Experiencias nuevas", start: 1, target: 6, unit: "/10", trackingIds: [] },
      { id: "viajes", label: "Viajes", start: 0, target: 1, unit: "viaje/año", trackingIds: [] },
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
