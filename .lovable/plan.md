

# Plan: Reorganizar Páginas - Index (Inicio) vs DailyView (Vista Diaria/HOY)

## Problema Identificado

Actualmente hay confusión entre dos páginas:

| Página | Ruta | Estado Actual | Estado Correcto |
|--------|------|---------------|-----------------|
| **Index.tsx** | `/` | Tiene TODA la información detallada del día | Debería ser un RESUMEN/DASHBOARD general |
| **DailyView.tsx** | `/daily` | Solo muestra tareas y hábitos básicos | Debería tener TODA la organización del día |

## Solución: Redistribuir Contenido

### Index.tsx (`/`) - Página de INICIO

Debería ser un **dashboard de alto nivel** con:
- Resumen rápido del día (score, progreso general)
- Pilares clickeables (para navegar a dashboards)
- Metas secundarias clickeables
- Acceso rápido a Focus, Planificador, etc.
- Estadísticas generales
- Motivación del día

### DailyView.tsx (`/daily`) - Vista Diaria/HOY

Debería contener **TODO lo que debo hacer hoy** con detalle extremo:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HOY                                            │
│                     Miércoles, 3 de Febrero                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🧭 GUÍA EN TIEMPO REAL                                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 07:23 - Bloque actual: GYM (37 min restantes)                        │ │
│  │ Próximo: Desayuno + Alistamiento (8:00 AM)                           │ │
│  │ 💡 Consejo: "Termina con estiramientos para maximizar recuperación"  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📚 LO QUE ESTOY APRENDIENDO HOY                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │ 📖 LIBRO ACTUAL: "Atomic Habits"                                      │ │
│  │    • Páginas para hoy: 156 → 180 (24 páginas)                         │ │
│  │    • Tiempo: 30 min (en bloque Lectura 7:30 PM)                       │ │
│  │    • Progreso total: 68% [████████████░░░░░░]                         │ │
│  │                                                                       │ │
│  │ 🎹 CANCIÓN APRENDIENDO: "River Flows In You"                          │ │
│  │    • Acordes a repasar: Am, G, C, F, Em                               │ │
│  │    • Tiempo: 30 min (en bloque Piano 7:30 PM)                         │ │
│  │    • Dificultad: Intermedia | Estado: Aprendiendo                     │ │
│  │                                                                       │ │
│  │ 🌍 IDIOMA DEL DÍA: Inglés                                             │ │
│  │    • Vocabulario (10 min) - 5:30 PM                                   │ │
│  │    • Duolingo (20 min) - 5:40 PM                                      │ │
│  │    • Habla con IA (10 min) - 6:00 PM                                  │ │
│  │    • Lectura (20 min) - 6:10 PM                                       │ │
│  │    • Escucha (30 min) - 6:30 PM                                       │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📋 MI PLAN DE HOY                                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 🔴 ALTA PRIORIDAD                                                     │ │
│  │   ☐ Estudiar Física Capítulo 5      🎓 Universidad    [9:00-10:30]   │ │
│  │   ☐ Terminar landing page           💼 Emprendimiento [11:00-12:30]  │ │
│  │                                                                       │ │
│  │ 🟡 TAREAS DEL DÍA                                                     │ │
│  │   ☑ Revisar métricas                💼 Emprendimiento [completada]   │ │
│  │   ☐ Post LinkedIn                   💼 Emprendimiento [14:00-15:30]  │ │
│  │                                                                       │ │
│  │ 🟢 HÁBITOS                                                            │ │
│  │   ☑ Gym 1 hora                      💪 [5:30-7:00]                   │ │
│  │   ☐ Lectura 30 min                  📖 [7:30 PM]                     │ │
│  │   ☐ Piano 30 min                    🎹 [8:00 PM]                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  🗓️ HORARIO COMPLETO DEL DÍA                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 05:00 │ ░░░ Rutina Activación                          [✓ Hecho]     │ │
│  │ 05:30 │ ░░░ Focus Emprendimiento                       [✓ Hecho]     │ │
│  │ 07:00 │ ███ GYM                                        [← AHORA]     │ │
│  │ 08:00 │     Desayuno + Alistamiento                                  │ │
│  │ 08:30 │     Clases Universidad                                       │ │
│  │ ...   │     ...                                                      │ │
│  │ 17:30 │     Idiomas + Lectura (90 min)                               │ │
│  │ 19:00 │     Ocio                                                     │ │
│  │ 19:30 │     Piano/Guitarra                                           │ │
│  │ 20:00 │     Rutina Desactivación                                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  🍽️ ALIMENTACIÓN DEL DÍA                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 05:30 ✅ Pre-entreno    → 2 huevos, pan (350 kcal)                    │ │
│  │ 08:00 ⏰ Desayuno       → [Registrar comida]                          │ │
│  │ 10:30 ○  Merienda       →                                             │ │
│  │ 13:20 ○  Almuerzo       →                                             │ │
│  │ 16:00 ○  Merienda       →                                             │ │
│  │ 19:00 ○  Comida         →                                             │ │
│  │ 20:40 ○  Merienda nocturna →                                          │ │
│  │──────────────────────────────────────────────────────────────────────│ │
│  │ 📊 HOY: 350/3200 kcal (11%)  |  Proteína: 20/150g                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📊 PROGRESO HOY POR ÁREA                                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 🎓 Universidad    ████████░░░░░░░░  2/3 tareas  → Obj semanal: 40%   │ │
│  │ 💼 Emprendimiento ██████░░░░░░░░░░  1/3 tareas  → Obj semanal: 33%   │ │
│  │ 💪 Gym            ████████████████  1/1 sesión  → Obj semanal: 60%   │ │
│  │ 🌍 Idiomas        ░░░░░░░░░░░░░░░░  0/5 tareas  → Obj semanal: 60%   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  🔗 CONEXIÓN DÍA → SEMANA → MES                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ HOY ●─────● SEMANA ●─────● MES ●─────● TRIMESTRE                      │ │
│  │ 3/8         15/25          48/100       Meta: Lanzar SiempreVende     │ │
│  │ 37%         60%            48%          [27%]                         │ │
│  │                                                                       │ │
│  │ 💡 Si completas hoy, tu semana sube de 60% a 72%                      │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Modificar

### 1. `src/pages/DailyView.tsx` (REESCRIBIR COMPLETAMENTE)

Transformar de página básica a centro de comando del día con:
- DailyGuide (guía en tiempo real)
- LearningToday (NUEVO) - libro, canción, idioma del día
- DailyActionPlan (tareas organizadas)
- EnhancedDayTimeline (horario visual)
- NutritionAITracker (alimentación)
- AreaStatsToday (progreso por área)
- TimelineConnection (día → semana → mes)
- CurrentBlockHighlight (bloque actual detallado)

### 2. `src/pages/Index.tsx` (SIMPLIFICAR)

Mantener solo contenido de dashboard de alto nivel:
- Header con saludo y fecha
- Score del día (mini resumen)
- PillarProgressGrid (clickeable)
- SecondaryGoalsProgress (clickeable)
- Quick Actions (botones de navegación)
- DailyMotivation
- WeekContext (posición en 12-week year)
- Link destacado a "Ver mi día completo" → `/daily`

### 3. `src/components/today/LearningToday.tsx` (NUEVO)

Componente que muestra:
- Libro actual con páginas a leer hoy y cuándo
- Canción aprendiendo con acordes a practicar
- Idioma del día con sub-tareas y horarios

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/components/today/LearningToday.tsx` | Libro, canción e idioma del día con horarios |
| `src/components/today/DailyScheduleOverview.tsx` | Horario completo del día visual |
| `src/components/today/QuickDaySummary.tsx` | Mini resumen para Index |

---

## Detalles Técnicos

### LearningToday.tsx

```typescript
// Datos a cargar:
// 1. Libro actual de reading_library (status = 'reading')
//    - Calcular páginas para hoy: (pages_total - pages_read) / días_restantes
//    - Horario: buscar bloque "Lectura" o "Idiomas + Lectura"
// 2. Canción aprendiendo de music_repertoire (status = 'learning')
//    - Mostrar notas/acordes del campo 'notes'
//    - Horario: buscar bloque "Piano" o "Guitarra"
// 3. Idioma del día de language_settings + language_sessions
//    - Sub-tareas con duraciones y completado
//    - Horario: bloque "Idiomas + Lectura"
```

### DailyScheduleOverview.tsx

```typescript
// Combinar:
// 1. Bloques de rutina de routine_blocks_db
// 2. Tareas asignadas a cada bloque
// 3. Hora actual para marcar "NOW"
// 4. Bloques completados del día
```

### Index.tsx Simplificado

```typescript
// Mantener:
// - Header con fecha
// - Pilares clickeables
// - Metas secundarias clickeables
// - Quick Actions
// - Motivación
// - WeekContext

// Agregar:
// - QuickDaySummary (score, tareas pendientes, próximo bloque)
// - Botón grande "📅 VER MI DÍA COMPLETO" → /daily

// Mover a DailyView:
// - DailyGuide
// - DailyActionPlan
// - AreaStatsToday
// - TimelineConnection
// - NutritionAITracker
// - InteractiveConsistencyTracker
// - CurrentBlockHighlight
// - EnhancedDayTimeline
// - MealTracker
// - DetailedDayStats
// - GoalContributions
```

---

## Orden de Implementación

1. **Crear LearningToday.tsx**
   - Cargar libro actual, canción aprendiendo, idioma del día
   - Calcular páginas/tiempo para hoy
   - Mostrar con horarios

2. **Crear DailyScheduleOverview.tsx**
   - Timeline visual del día completo
   - Marcar hora actual y bloques completados

3. **Crear QuickDaySummary.tsx**
   - Mini resumen para Index
   - Score, pendientes, próximo bloque

4. **Reescribir DailyView.tsx**
   - Integrar todos los componentes del día
   - Organización clara y completa

5. **Simplificar Index.tsx**
   - Mover componentes detallados a DailyView
   - Mantener dashboard de alto nivel
   - Agregar link prominente a /daily

6. **Actualizar Navigation.tsx**
   - Asegurar que "Hoy" o "Vista Diaria" sea accesible

