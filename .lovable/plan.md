
# Plan: Mejorar Conexión Día → Semana → Mes en la Página HOY

## Problema Identificado

La página HOY tiene muchos componentes pero **falta claridad** sobre:
1. **Qué debo hacer exactamente hoy** - Las tareas están distribuidas en múltiples secciones
2. **Estadísticas por área en tiempo real** - El progreso por pilar no muestra detalles
3. **Conexión visible entre día → semana → mes** - No es evidente cómo las acciones de hoy impactan los objetivos

## Solución Propuesta

### 1. Nuevo Componente: "Mi Plan de Hoy" (DailyActionPlan.tsx)

Mostrará en un solo lugar todo lo que debe hacerse hoy, organizado por prioridad y bloque:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📋 MI PLAN DE HOY                                    [3/8 completadas]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 🔴 ALTA PRIORIDAD                                                          │
│   ☐ Estudiar Física - Capítulo 5           🎓 Universidad    [5:30-7:00]   │
│   ☐ Terminar landing page                  💼 Emprendimiento [8:30-10:00] │
│                                                                             │
│ 🟡 MEDIA PRIORIDAD                                                         │
│   ☑ Revisar métricas SiempreVende          💼 Emprendimiento [completada]  │
│   ☐ Post LinkedIn sobre productividad      💼 Emprendimiento [11:00-12:30]│
│   ☐ 45 min de inglés - Vocabulario         🌍 Idiomas        [17:30-19:00]│
│                                                                             │
│ 🟢 HÁBITOS DEL DÍA                                                         │
│   ☑ Gym 1 hora                             💪 Gym                          │
│   ☐ Lectura 30 min                         📖 Lectura                      │
│   ☐ Piano o Guitarra                       🎹 Música                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Nuevo Componente: "Estadísticas por Área Hoy" (AreaStatsToday.tsx)

Reemplazará el TodayStats actual con métricas más detalladas por área:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 MI PROGRESO HOY POR ÁREA                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 🎓 Universidad       ████████░░░░░░░░  2/3 tareas   2.0h    → 80%          │
│    Objetivo semanal: Estudiar 10h                   [4h/10h = 40%]          │
│                                                                             │
│ 💼 Emprendimiento    ██████░░░░░░░░░░  1/3 tareas   1.5h    → 50%          │
│    Objetivo semanal: 3 posts LinkedIn              [1/3 = 33%]             │
│                                                                             │
│ 🚀 Proyectos         ░░░░░░░░░░░░░░░░  0/1 tareas   0h      → 0%           │
│    Objetivo semanal: Avanzar 20%                   [0%]                    │
│                                                                             │
│ 💪 Gym               ████████████████  ✅ 1h         1.0h    → 100%         │
│    Objetivo semanal: 5 sesiones                    [3/5 = 60%]             │
│                                                                             │
│ 🌍 Idiomas           ░░░░░░░░░░░░░░░░  0/5 subtareas 0h      → 0%           │
│    Objetivo semanal: 5h de práctica                [3h/5h = 60%]           │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────  │
│ TOTAL HOY: 4.5h de trabajo productivo              SCORE: 46/100           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Nuevo Componente: "Conexión Temporal" (TimelineConnection.tsx)

Visualizará cómo las acciones de hoy conectan con semana, mes y metas:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔗 CÓMO HOY CONSTRUYE MI FUTURO                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   HOY              ESTA SEMANA        ESTE MES         TRIMESTRE           │
│   ●────────────────●────────────────●────────────────●                     │
│   │                │                │                │                     │
│   │ 3 tareas       │ 15/25 tareas   │ 48/100 tareas  │ Q1: Lanzar         │
│   │ completadas    │ 60%            │ 48%            │ SiempreVende       │
│   │                │                │                │ [27%]              │
│   │ 1h gym         │ 3/5 sesiones   │ 12/20 sesiones │ Meta: +8kg         │
│   │ ✅             │ 60%            │ 60%            │ [1.5kg = 18%]      │
│   │                │                │                │                     │
│   │ 0h idiomas     │ 3/5 horas      │ 12/20 horas    │ Meta: B2 English   │
│   │ (pendiente)    │ 60%            │ 60%            │ [45%]              │
│   │                │                │                │                     │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────  │
│ 💡 Si completas tus tareas de hoy, tu semana subirá de 60% a 72%           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Mejora del DailyGuide.tsx

Agregar más contexto y conexión con objetivos semanales:

- Mostrar qué objetivo semanal se está trabajando en el bloque actual
- Calcular impacto de completar tareas actuales en metas semanales/mensuales
- Mostrar advertencias si el progreso semanal está bajo

### 5. Nuevo Hook: useTimelineProgress.ts

Hook que calculará todas las métricas de conexión temporal:

```typescript
interface TimelineProgress {
  today: {
    tasksCompleted: number;
    tasksTotal: number;
    hoursWorked: number;
    areaBreakdown: AreaProgress[];
  };
  week: {
    tasksCompleted: number;
    tasksTotal: number;
    objectivesProgress: ObjectiveProgress[];
    daysRemaining: number;
    onTrack: boolean;
  };
  month: {
    tasksCompleted: number;
    daysProductiveCount: number;
    averageScore: number;
    trend: 'up' | 'down' | 'stable';
  };
  quarter: {
    goalsProgress: GoalProgress[];
    weekNumber: number;
    onTrack: boolean;
  };
  projections: {
    weeklyCompletionIfTodayDone: number;
    monthlyImpact: number;
    quarterlyGoalContribution: number;
  };
}
```

### 6. Reorganización de Index.tsx

Orden propuesto de componentes para mejor claridad:

1. **Header + Fecha**
2. **DailyGuide** - Bloque actual y próximo
3. **DailyActionPlan** (NUEVO) - Todo lo que debo hacer hoy
4. **AreaStatsToday** (NUEVO) - Progreso por área con conexión semanal
5. **TimelineConnection** (NUEVO) - Día → Semana → Mes
6. **PillarProgressGrid** - Clickeable a dashboards
7. **SecondaryGoalsProgress** - Clickeable
8. **NutritionAITracker** - Alimentación
9. **InteractiveConsistencyTracker** - Marcado rápido
10. **CurrentBlockHighlight** - Bloque actual detallado
11. **Quick Actions** - Botones de navegación

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/components/today/DailyActionPlan.tsx` | Lista consolidada de tareas del día |
| `src/components/today/AreaStatsToday.tsx` | Estadísticas por área con objetivos semanales |
| `src/components/today/TimelineConnection.tsx` | Visualización día → semana → mes |
| `src/hooks/useTimelineProgress.ts` | Hook para calcular métricas de conexión |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Index.tsx` | Reorganizar componentes, integrar nuevos |
| `src/components/today/DailyGuide.tsx` | Agregar conexión con objetivos semanales |
| `src/pages/MonthlyView.tsx` | Migrar de localStorage a Supabase |
| `src/pages/WeeklyView.tsx` | Agregar resumen de impacto mensual |

## Detalles Técnicos

### useTimelineProgress.ts

```typescript
// Lógica principal:
// 1. Cargar tareas de hoy, semana y mes en paralelo
// 2. Cargar objetivos semanales
// 3. Calcular porcentajes y proyecciones
// 4. Determinar si está "on track" basado en días restantes
// 5. Calcular impacto de completar tareas pendientes

const calculateProjections = (todayPending: number, weeklyProgress: number) => {
  // Si completo las X tareas pendientes de hoy...
  const newWeeklyTotal = weeklyProgress + todayPending;
  const projectedWeeklyPercent = newWeeklyTotal / weeklyGoal * 100;
  return projectedWeeklyPercent;
};
```

### DailyActionPlan.tsx

```typescript
// Agrupa tareas por prioridad y muestra:
// - Checkbox interactivo
// - Título de la tarea
// - Área/pilar (con icono)
// - Bloque asignado (si existe)
// - Conexión con objetivo semanal
```

### AreaStatsToday.tsx

```typescript
// Para cada área:
// 1. Cargar tareas del día
// 2. Cargar objetivo semanal correspondiente
// 3. Calcular horas trabajadas (de focus_sessions o estimado)
// 4. Mostrar barra de progreso dual: hoy y semana
```

## Beneficios

1. **Claridad inmediata**: Al abrir la app, sé exactamente qué debo hacer
2. **Motivación contextual**: Veo cómo cada tarea impacta mis metas
3. **Feedback en tiempo real**: El progreso se actualiza al completar
4. **Decisiones informadas**: Sé si estoy "on track" o debo acelerar
5. **Conexión emocional**: Entiendo el "por qué" de cada acción
