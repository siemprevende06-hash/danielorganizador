
# Plan Integral: Mejora Completa del Sistema de Productividad

## RESUMEN DE CAMBIOS SOLICITADOS

### 1. Mejorar la Página de HOY (Index)
- Mostrar hábitos diarios con horarios
- Mostrar tareas organizadas por bloque
- Estado de alimentación del día
- Bloque actual destacado
- Guía visual a lo largo del día

### 2. Mejorar Vista Semanal
- Agregar objetivos semanales por área
- Conexión entre acciones diarias y objetivos semanales
- Usar datos de Supabase (actualmente usa localStorage)

### 3. Sistema de Registro de Nutrición con IA
- Registrar qué se comió en cada horario
- IA estima calorías consumidas vs plan
- IA como nutricionista y entrenadora personal
- Nueva tabla para detalles de comidas

### 4. Mejorar Focus Mode
- Selector de tarea específica a enfocar
- Guardar sesiones de focus para estadísticas
- Nueva tabla `focus_sessions`

### 5. Nueva Página: "Escalones de Confianza"
- Objetivos a corto plazo por área
- Vista día/semana/mes
- Sub-tareas y progreso
- Nueva tabla `confidence_steps`

### 6. Mejorar IA del Homepage
- Convertirla en consejero/terapeuta personal
- Mejorar edge function con contexto más profundo

### 7. Pilares y Metas Clickeables → Dashboards Dedicados
- Universidad → Dashboard universitario
- Emprendimiento → Dashboard de proyectos
- Gym → Dashboard físico (ya existe en vida-daniel)
- Idiomas → Dashboard de inglés/italiano
- Piano → Canciones aprendidas
- Lectura → Biblioteca con portadas

---

## ARQUITECTURA DE CAMBIOS

### NUEVAS TABLAS EN BASE DE DATOS

```sql
-- 1. Detalles de comidas para tracking de nutrición
CREATE TABLE meal_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_tracking_id UUID REFERENCES meal_tracking(id),
  description TEXT NOT NULL,
  estimated_calories INTEGER,
  protein_grams NUMERIC,
  carbs_grams NUMERIC,
  fat_grams NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sesiones de focus para estadísticas
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  task_id UUID,
  task_title TEXT NOT NULL,
  block_id TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Escalones de confianza
CREATE TABLE confidence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  area TEXT NOT NULL, -- 'universidad', 'emprendimiento', 'gym', etc.
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1, -- nivel de confianza actual
  target_level INTEGER DEFAULT 2, -- nivel objetivo
  parent_id UUID, -- para sub-tareas
  view_type TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Objetivos semanales
CREATE TABLE weekly_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  week_start_date DATE NOT NULL,
  area TEXT NOT NULL,
  title TEXT NOT NULL,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Biblioteca de lectura
CREATE TABLE reading_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  author TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'to_read', -- 'to_read', 'reading', 'completed'
  start_date DATE,
  finish_date DATE,
  rating INTEGER,
  notes TEXT,
  pages_total INTEGER,
  pages_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Canciones de piano/guitarra
CREATE TABLE music_repertoire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  instrument TEXT NOT NULL, -- 'piano', 'guitar'
  title TEXT NOT NULL,
  artist TEXT,
  difficulty TEXT, -- 'beginner', 'intermediate', 'advanced'
  status TEXT DEFAULT 'learning', -- 'learning', 'mastered'
  youtube_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### NUEVOS ARCHIVOS A CREAR

**Páginas:**
1. `src/pages/ConfidenceSteps.tsx` - Escalones de confianza
2. `src/pages/UniversityDashboard.tsx` - Dashboard completo universidad
3. `src/pages/GymDashboard.tsx` - Dashboard fitness (redirige a vida-daniel)
4. `src/pages/LanguagesDashboard.tsx` - Dashboard idiomas
5. `src/pages/MusicDashboard.tsx` - Canciones piano/guitarra
6. `src/pages/ReadingLibrary.tsx` - Biblioteca de lectura

**Componentes:**
1. `src/components/today/EnhancedHabitsSchedule.tsx` - Hábitos con horarios
2. `src/components/today/DailyGuide.tsx` - Guía del día paso a paso
3. `src/components/today/NutritionAITracker.tsx` - Tracker con IA
4. `src/components/today/ClickablePillarCard.tsx` - Pilares clickeables
5. `src/components/weekly/WeeklyObjectives.tsx` - Objetivos semanales
6. `src/components/weekly/DailyToWeeklyConnection.tsx` - Conexión visual
7. `src/components/focus/TaskSelector.tsx` - Selector de tarea a enfocar
8. `src/components/confidence/ConfidenceStepCard.tsx` - Tarjeta de escalón
9. `src/components/confidence/ProgressLadder.tsx` - Visualización escalera
10. `src/components/reading/BookCard.tsx` - Tarjeta de libro
11. `src/components/music/SongCard.tsx` - Tarjeta de canción

**Hooks:**
1. `src/hooks/useNutritionAI.ts` - Comunicación con IA nutricionista
2. `src/hooks/useFocusSessions.ts` - CRUD focus sessions
3. `src/hooks/useConfidenceSteps.ts` - CRUD escalones
4. `src/hooks/useWeeklyObjectives.ts` - CRUD objetivos semanales
5. `src/hooks/useReadingLibrary.ts` - CRUD biblioteca
6. `src/hooks/useMusicRepertoire.ts` - CRUD repertorio musical

**Edge Functions:**
1. `supabase/functions/nutrition-ai/index.ts` - IA nutricionista

### ARCHIVOS A MODIFICAR

1. **`src/pages/Index.tsx`**
   - Agregar EnhancedHabitsSchedule
   - Agregar DailyGuide
   - Hacer PillarProgressGrid y SecondaryGoalsProgress clickeables
   - Mejorar integración con IA

2. **`src/pages/WeeklyView.tsx`**
   - Migrar de localStorage a Supabase
   - Agregar WeeklyObjectives
   - Agregar conexión diario→semanal

3. **`src/pages/Focus.tsx`**
   - Agregar TaskSelector
   - Guardar sesiones de focus
   - Mostrar estadísticas de sesiones anteriores

4. **`src/components/today/MealTracker.tsx`**
   - Agregar botón para registrar detalles de comida
   - Mostrar calorías estimadas por IA
   - Mostrar progreso hacia meta calórica

5. **`src/components/pillars/PillarCard.tsx`**
   - Hacerlo clickeable con Link a dashboard correspondiente

6. **`src/components/pillars/SecondaryGoalsProgress.tsx`**
   - Hacerlo clickeable con Link a dashboard correspondiente

7. **`src/App.tsx`**
   - Agregar nuevas rutas

8. **`src/components/Navigation.tsx`**
   - Agregar enlace a "Escalones de Confianza"

---

## DETALLES DE IMPLEMENTACIÓN

### 1. PÁGINA HOY MEJORADA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HOY                                            │
│                     Miércoles, 29 de Enero                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🧭 GUÍA DEL DÍA                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 07:23 AM - Estás en: GYM                                              │ │
│  │ ⏳ Te quedan 37 minutos en este bloque                                 │ │
│  │                                                                       │ │
│  │ ✅ Ya completaste: Rutina Activación, Meditación                      │ │
│  │ 📌 Próximo: Desayuno + Alistamiento (8:00 AM)                         │ │
│  │                                                                       │ │
│  │ 💡 Consejo IA: "Buen progreso! No olvides tu desayuno post-entreno   │ │
│  │    para maximizar la síntesis de proteínas 💪"                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ⭐ PROGRESO EN MIS 5 PILARES          (clickeable → abre dashboard)      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │🎓 Univ  │ │💼 Empr  │ │🚀 Proy  │ │💪 Gym   │ │🌍 Idiom │               │
│  │  65%    │ │  40%    │ │  80%    │ │  90%    │ │  55%    │               │
│  │ 2/3 ✓   │ │ 1/2 ✓   │ │ 4/5 ✓   │ │ 1h ✓    │ │ 45min   │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│  (click)     (click)     (click)     (click)     (click)                   │
│                                                                             │
│  🎯 METAS SECUNDARIAS                  (clickeable → abre dashboard)      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │🎹 Piano/🎸   │ │📖 Lectura   │ │♟️ Ajedrez   │ │🎬 GoT        │       │
│  │  Pendiente   │ │  30min ✓    │ │  1 partida  │ │  Pendiente   │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│  → Canciones     → Biblioteca    (tap complete)  (tap complete)            │
│                                                                             │
│  🍽️ ALIMENTACIÓN                            Meta: +2.2kg/mes              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 05:30 ✅ Pre-entreno    → 2 huevos, pan, café (350 kcal est.)         │ │
│  │ 08:00 ⏰ Desayuno       → [Registrar comida]                          │ │
│  │ 10:30 ○  Merienda                                                     │ │
│  │ ...                                                                   │ │
│  │──────────────────────────────────────────────────────────────────────│ │
│  │ 📊 HOY: 350/3200 kcal (11%)  |  Proteína: 20/150g                     │ │
│  │ 🎯 Necesitas comer ~1000 kcal más para llegar a tu meta               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📋 HÁBITOS DEL DÍA (con horarios)                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ ☀️ MAÑANA (5-8 AM)                                                     │ │
│  │   ✅ Meditación (5:00)                                                 │ │
│  │   ✅ Gym (5:30-7:00)                                                   │ │
│  │   ○  Agua 1L (antes 8:00)                                             │ │
│  │                                                                       │ │
│  │ 🌤️ DÍA (8 AM - 6 PM)                                                   │ │
│  │   ○  Caminata 10min (almuerzo)                                        │ │
│  │   ○  Agua 2L (antes 3:00 PM)                                          │ │
│  │                                                                       │ │
│  │ 🌙 NOCHE (6-9 PM)                                                      │ │
│  │   ○  Estiramientos (8:30 PM)                                          │ │
│  │   ○  Skincare (8:45 PM)                                               │ │
│  │   ○  Journaling (9:00 PM)                                             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ... (resto del contenido actual) ...                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. VISTA SEMANAL MEJORADA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VISTA SEMANAL                                       │
│                    Semana 5 - Enero 27 - Feb 2                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🎯 OBJETIVOS DE ESTA SEMANA                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🎓 Universidad                                                      │   │
│  │   □ Completar 5 ejercicios de Física         [2/5] ████░░░░░░ 40%  │   │
│  │   □ Estudiar 10 horas total                  [4h/10h] ████░░░░ 40% │   │
│  │                                                                     │   │
│  │ 💼 Emprendimiento                                                   │   │
│  │   □ Lanzar landing page de SiempreVende      [En progreso] 70%     │   │
│  │   □ 3 posts en LinkedIn                      [1/3] ███░░░░░░ 33%   │   │
│  │                                                                     │   │
│  │ 💪 Gym                                                              │   │
│  │   □ 5 sesiones de 1 hora                     [3/5] ██████░░░ 60%   │   │
│  │   □ Aumentar peso en press banca             [Pendiente]           │   │
│  │                                                                     │   │
│  │ 🌍 Idiomas                                                          │   │
│  │   □ 5 horas de inglés                        [3h/5h] ██████░░ 60%  │   │
│  │   □ 1 conversación con IA                    [✅ Completado]        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  📊 CONEXIÓN: LO QUE HAGO HOY → OBJETIVOS SEMANALES                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Tarea de hoy              →    Objetivo semanal                   │   │
│  │  ─────────────────────────────────────────────────────────────────│   │
│  │  ✅ 1h Gym                  →    5 sesiones [4/5] ↑                │   │
│  │  ○  Ejercicio Física #3    →    5 ejercicios [2/5]                │   │
│  │  ○  45min Inglés           →    5h idiomas [3.5h/5h] ↑            │   │
│  │  ○  Post LinkedIn          →    3 posts [1/3]                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  📅 CALENDARIO SEMANAL                                                     │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                               │
│  │ Lun │ Mar │ Mié │ Jue │ Vie │ Sáb │ Dom │                               │
│  │ 27  │ 28  │ 29  │ 30  │ 31  │  1  │  2  │                               │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                               │
│  │ 85% │ 78% │ NOW │  -  │  -  │  -  │  -  │                               │
│  │ 🟢  │ 🟢  │ 🟡  │  ○  │  ○  │  ○  │  ○  │                               │
│  │     │     │     │     │     │     │     │                               │
│  │ T:5 │ T:4 │ T:2 │     │     │     │     │                               │
│  │ H:8 │ H:7 │ H:3 │     │     │     │     │                               │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. SISTEMA DE NUTRICIÓN CON IA

**Edge Function: `nutrition-ai`**

```typescript
// El usuario describe lo que comió
// La IA estima calorías, proteínas, carbohidratos, grasas
// Compara con el plan de aumento de peso

Prompt de sistema:
"Eres un nutricionista deportivo experto. Daniel pesa 50kg y quiere llegar a 70kg.
Su plan requiere ~3200 kcal/día, ~150g proteína.
Estima las calorías y macros de la comida que describe.
Responde en JSON: { calories, protein, carbs, fat, advice }"
```

**Flujo de usuario:**
1. Usuario toca "Registrar comida" en un horario
2. Abre modal con input de texto
3. Describe lo que comió (ej: "2 huevos revueltos, 2 tostadas, café con leche")
4. IA procesa y devuelve estimación
5. Se guarda en `meal_details`
6. Se actualiza el progreso calórico del día

### 4. FOCUS MODE MEJORADO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FOCUS MODE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ ¿En qué tarea te vas a enfocar?                                      │ │
│  │                                                                       │ │
│  │ [Seleccionar tarea ▼]                                                 │ │
│  │   ├─ ⚠️ Ejercicio Física #3 (Alta prioridad)                          │ │
│  │   ├─ Post LinkedIn SiempreVende                                       │ │
│  │   ├─ Revisar métricas del día                                         │ │
│  │   └─ Estudiar vocabulario inglés                                      │ │
│  │                                                                       │ │
│  │ O crear nueva tarea: [_____________________]                          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │                     FOCUS ACTUAL                                      │ │
│  │                                                                       │ │
│  │              📚 Ejercicio Física #3                                   │ │
│  │                   (Universidad)                                       │ │
│  │                                                                       │ │
│  │                    ┌─────────┐                                        │ │
│  │                    │  25:00  │  ← Pomodoro timer                      │ │
│  │                    └─────────┘                                        │ │
│  │                                                                       │ │
│  │              [▶ Iniciar]  [⏸ Pausar]  [⏹ Terminar]                    │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📊 ESTADÍSTICAS DE FOCUS                                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ HOY: 45 min de focus (2 sesiones)                                    │ │
│  │ ESTA SEMANA: 4.5h de focus                                            │ │
│  │ SESIÓN MÁS LARGA: 52 min (Física - Lunes)                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5. PÁGINA ESCALONES DE CONFIANZA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     🪜 ESCALONES DE CONFIANZA                               │
│            "Cada paso te acerca a tu mejor versión"                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Vista: [Día] [Semana] [Mes]                                                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         TU ESCALERA                                   │ │
│  │                                                                       │ │
│  │                                           ★ NIVEL 5: Maestro         │ │
│  │                                      ┌────────────────────┐          │ │
│  │                                 ★ 4: │     Experto        │          │ │
│  │                            ┌────────────────────┐         │          │ │
│  │                       ★ 3: │   Intermedio       │         │          │ │
│  │                  ┌────────────────────┐         │         │          │ │
│  │             ★ 2: │   Aprendiz         │ ← AQUÍ  │         │          │ │
│  │        ┌────────────────────┐         │         │         │          │ │
│  │   ★ 1: │   Principiante     │         │         │         │          │ │
│  │        └────────────────────┘         └─────────┘         └──────────┘ │
│  │                                                                       │ │
│  │  Progreso al siguiente nivel: ████████░░░░░░░░ 62%                   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📋 OBJETIVOS PARA SUBIR AL NIVEL 3                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │ 🎓 UNIVERSIDAD                                                        │ │
│  │   ┌─────────────────────────────────────────────────────────────────┐│ │
│  │   │ ☑️ Aprobar primer parcial de Física           [✅ Completado]   ││ │
│  │   │ ☐ Aprobar segundo parcial de Física           [En progreso]    ││ │
│  │   │    └─ Sub-tarea: Resolver 20 ejercicios       [12/20] 60%      ││ │
│  │   │    └─ Sub-tarea: Repasar teoría cap 5-8       [2/4] 50%        ││ │
│  │   │ ☐ Mantener promedio > 8.0                     [7.8 actual]     ││ │
│  │   └─────────────────────────────────────────────────────────────────┘│ │
│  │                                                                       │ │
│  │ 💼 EMPRENDIMIENTO                                                     │ │
│  │   ┌─────────────────────────────────────────────────────────────────┐│ │
│  │   │ ☑️ Crear landing page                          [✅ Completado]   ││ │
│  │   │ ☐ Conseguir primeros 10 usuarios              [3/10] 30%       ││ │
│  │   │ ☐ Primera venta                               [Pendiente]      ││ │
│  │   └─────────────────────────────────────────────────────────────────┘│ │
│  │                                                                       │ │
│  │ 💪 GYM                                                                │ │
│  │   ┌─────────────────────────────────────────────────────────────────┐│ │
│  │   │ ☑️ 30 días consecutivos de gym                 [✅ 32 días!]     ││ │
│  │   │ ☐ Press banca 30kg x 10 reps                  [25kg actual]    ││ │
│  │   │ ☐ Ganar 4kg de peso                           [+1.5kg] 37%     ││ │
│  │   └─────────────────────────────────────────────────────────────────┘│ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [+ Agregar nuevo escalón]                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6. DASHBOARDS POR PILAR

**Mapeo de clicks:**

| Pilar/Meta | Ruta | Dashboard |
|------------|------|-----------|
| Universidad | `/university` | Ya existe - mejorar con stats |
| Emprendimiento | `/entrepreneurship` | Ya existe - agregar métricas |
| Proyectos | `/projects` | Ya existe |
| Gym | `/gym-dashboard` o `/vida-daniel` | Redirigir a sección física |
| Idiomas | `/languages-dashboard` | Nuevo - English/Italian progress |
| Piano | `/music-dashboard?instrument=piano` | Nuevo - lista canciones |
| Guitarra | `/music-dashboard?instrument=guitar` | Nuevo - lista canciones |
| Lectura | `/reading-library` | Nuevo - biblioteca con portadas |
| Ajedrez | `activity_tracking` toggle | Solo marcar completado |

### 7. BIBLIOTECA DE LECTURA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         📚 MI BIBLIOTECA                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Leyendo] [Por Leer] [Completados]              [+ Agregar Libro]         │
│                                                                             │
│  📖 LEYENDO AHORA                                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ ┌─────────┐                                                           │ │
│  │ │ [Cover] │  Atomic Habits                                            │ │
│  │ │  Image  │  James Clear                                              │ │
│  │ │         │                                                           │ │
│  │ │         │  Progreso: ████████████░░░░░░ 68%                        │ │
│  │ └─────────┘  Página 156 de 230                                        │ │
│  │              [Actualizar progreso]                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📚 LIBROS COMPLETADOS (12)                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ [Cover] │ │ [Cover] │ │ [Cover] │ │ [Cover] │ │ [Cover] │ │ [Cover] │  │
│  │ Deep    │ │ The     │ │ Start   │ │ Zero    │ │ Think   │ │ Rich    │  │
│  │ Work    │ │ Lean    │ │ With    │ │ to One  │ │ & Grow  │ │ Dad     │  │
│  │ ★★★★★  │ │ ★★★★☆  │ │ ★★★★☆  │ │ ★★★★★  │ │ ★★★☆☆  │ │ ★★★★☆  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                             │
│  📊 ESTADÍSTICAS                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Total libros leídos: 12  |  Este año: 3  |  Meta anual: 24           │ │
│  │ Páginas leídas: 3,450    |  Tiempo estimado: 86 horas                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ORDEN DE IMPLEMENTACIÓN

### Fase 1: Base de Datos
1. Crear tablas: `meal_details`, `focus_sessions`, `confidence_steps`, `weekly_objectives`, `reading_library`, `music_repertoire`
2. Agregar políticas RLS "Allow all"

### Fase 2: Hooks y Edge Functions
1. Crear `useNutritionAI.ts`
2. Crear `useFocusSessions.ts`
3. Crear `useConfidenceSteps.ts`
4. Crear `useWeeklyObjectives.ts`
5. Crear `useReadingLibrary.ts`
6. Crear `useMusicRepertoire.ts`
7. Crear edge function `nutrition-ai`

### Fase 3: Componentes de HOY
1. Crear `DailyGuide.tsx`
2. Crear `EnhancedHabitsSchedule.tsx`
3. Modificar `MealTracker.tsx` para integrar IA
4. Hacer pilares clickeables

### Fase 4: Vista Semanal
1. Migrar WeeklyView de localStorage a Supabase
2. Crear `WeeklyObjectives.tsx`
3. Crear `DailyToWeeklyConnection.tsx`

### Fase 5: Focus Mode
1. Crear `TaskSelector.tsx`
2. Modificar `Focus.tsx` para guardar sesiones
3. Agregar estadísticas de focus

### Fase 6: Escalones de Confianza
1. Crear página `ConfidenceSteps.tsx`
2. Crear componentes de visualización
3. Agregar a navegación

### Fase 7: Dashboards y Biblioteca
1. Crear `LanguagesDashboard.tsx`
2. Crear `MusicDashboard.tsx`
3. Crear `ReadingLibrary.tsx`
4. Agregar rutas y navegación

### Fase 8: Mejorar IA
1. Actualizar `daily-assistant` para ser más personal
2. Agregar contexto de consejero/terapeuta
3. Integrar mejor en la UI
