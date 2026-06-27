export interface MetricDef {
  id: string
  label: string
  unit: string
  targetWeek: number | null
  targetMonth: number
  targetQuarter: number
}

export interface AreaWithMetrics {
  areaId: string
  label: string
  icon: string
  color: string
  group: 'principales' | 'adicionales'
  metrics: MetricDef[]
}

export const AREAS_WITH_METRICS: AreaWithMetrics[] = [
  {
    areaId: 'universidad', label: 'Universidad', icon: '🎓',
    color: 'bg-blue-500', group: 'principales',
    metrics: [
      { id: 'uni_tareas', label: 'Tareas grandes completadas', unit: 'tareas', targetWeek: 2, targetMonth: 8, targetQuarter: 24 },
      { id: 'uni_nota', label: 'Nota promedio', unit: '', targetWeek: null, targetMonth: 4, targetQuarter: 4 },
    ],
  },
  {
    areaId: 'emprendimiento', label: 'Emprendimiento', icon: '💼',
    color: 'bg-purple-500', group: 'principales',
    metrics: [
      { id: 'emp_tareas', label: 'Tareas completadas', unit: 'tareas', targetWeek: 5, targetMonth: 20, targetQuarter: 80 },
    ],
  },
  {
    areaId: 'proyectos', label: 'Proyectos', icon: '🚀',
    color: 'bg-amber-500', group: 'principales',
    metrics: [
      { id: 'pro_tareas', label: 'Avances significativos', unit: 'tareas', targetWeek: 3, targetMonth: 12, targetQuarter: 36 },
    ],
  },
  {
    areaId: 'gym', label: 'Gym', icon: '💪',
    color: 'bg-red-500', group: 'principales',
    metrics: [
      { id: 'gym_dias', label: 'Días entrenados', unit: 'días', targetWeek: 5, targetMonth: 20, targetQuarter: 60 },
    ],
  },
  {
    areaId: 'idiomas', label: 'Idiomas', icon: '🌍',
    color: 'bg-emerald-500', group: 'principales',
    metrics: [
      { id: 'idi_horas', label: 'Horas de estudio', unit: 'horas', targetWeek: 3, targetMonth: 12, targetQuarter: 48 },
    ],
  },
  {
    areaId: 'lectura', label: 'Lectura', icon: '📖',
    color: 'bg-cyan-500', group: 'adicionales',
    metrics: [
      { id: 'lec_libros', label: 'Libros leídos', unit: 'libros', targetWeek: 0.5, targetMonth: 2, targetQuarter: 6 },
    ],
  },
  {
    areaId: 'piano', label: 'Piano', icon: '🎹',
    color: 'bg-pink-500', group: 'adicionales',
    metrics: [
      { id: 'piano_canciones', label: 'Canciones aprendidas', unit: 'canciones', targetWeek: null, targetMonth: 1, targetQuarter: 3 },
    ],
  },
  {
    areaId: 'guitarra', label: 'Guitarra', icon: '🎸',
    color: 'bg-orange-500', group: 'adicionales',
    metrics: [
      { id: 'gui_canciones', label: 'Canciones aprendidas', unit: 'canciones', targetWeek: null, targetMonth: 1, targetQuarter: 3 },
    ],
  },
]

export const EFFORT_DEFAULTS: Record<string, { bajo: number; normal: number; alto: number }> = {
  universidad: { bajo: 60, normal: 120, alto: 180 },
  emprendimiento: { bajo: 30, normal: 60, alto: 120 },
  proyectos: { bajo: 15, normal: 30, alto: 60 },
  gym: { bajo: 30, normal: 45, alto: 60 },
  idiomas: { bajo: 15, normal: 30, alto: 45 },
  lectura: { bajo: 15, normal: 30, alto: 45 },
  piano: { bajo: 15, normal: 30, alto: 45 },
  guitarra: { bajo: 15, normal: 30, alto: 45 },
}
