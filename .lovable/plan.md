

# Plan Integral: Sincronización, Planificación y Alineación de Vida

## DIAGNÓSTICO DE PROBLEMAS

### 1. Las tareas no aparecen en todos los dispositivos
**Causa raíz:** 
- La tabla `tasks` tiene políticas RLS que requieren `auth.uid() = user_id`
- El código en `Tasks.tsx` (línea 85-86) requiere usuario autenticado para crear tareas
- Sin embargo, según la memoria del proyecto, la app opera SIN autenticación

**Tablas afectadas con RLS restrictivo:**
- `tasks` - requiere auth.uid()
- `projects` - requiere auth.uid()
- `goals` - requiere auth.uid()
- `goal_tasks` - requiere auth.uid()
- `goal_block_connections` - requiere auth.uid()
- `exams` - requiere auth.uid()
- `university_subjects` - requiere auth.uid()
- `user_settings` - requiere auth.uid()

### 2. Datos guardados en localStorage (no sincroniza)
**Archivos que usan localStorage:**
| Archivo | Datos |
|---------|-------|
| `useRoutineBlocks.ts` | Bloques de rutina personalizados |
| `Projects.tsx` | Lista de proyectos |
| `ControlRoom.tsx` | Tareas, hábitos, metas mensuales/trimestrales |
| `Tools.tsx` | Visión de pareja ideal |
| `Finance.tsx` | Wallets, transacciones, préstamos, tasa de cambio |

### 3. Planificador de día mal implementado
**Problemas en `BlockTaskPlanner.tsx` (línea 138-144):**
```tsx
const workBlocks = blocks.filter(block => 
  block.title.toLowerCase().includes('deep work') ||
  // ...solo muestra bloques de trabajo
);
```
- Solo muestra 5-6 bloques de los 22 totales
- No muestra: Gym, Almuerzo, Idiomas (ahora en tarde), etc.
- No permite crear tareas desde la sección

### 4. Falta editar tareas y ocultar completadas
- No existe botón de editar en `Tasks.tsx`
- No hay filtro para ocultar tareas completadas

---

## SOLUCIONES PROPUESTAS

### FASE 1: ARREGLAR RLS Y AUTENTICACIÓN

**Cambio de políticas RLS a "Allow all":**
```sql
-- Para cada tabla afectada (tasks, projects, goals, etc.)
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
```

Tablas a migrar:
1. `tasks`
2. `projects`
3. `goals`
4. `goal_tasks`
5. `goal_block_connections`
6. `exams`
7. `university_subjects`
8. `user_settings`

**Modificar código para no requerir auth:**
- `Tasks.tsx`: Remover líneas 85-86 que verifican usuario autenticado
- Usar un user_id fijo o null para todas las operaciones

### FASE 2: MIGRAR LOCALSTORAGE A SUPABASE

**Cambios por archivo:**

1. **`useRoutineBlocks.ts` → usar `useRoutineBlocksDB.ts`**
   - Ya existe `useRoutineBlocksDB.ts` que usa Supabase
   - Actualizar imports en archivos que usan `useRoutineBlocks`

2. **`Projects.tsx`**
   - Migrar a usar tabla `projects` de Supabase
   - Agregar lógica de migración one-time desde localStorage

3. **`ControlRoom.tsx`**
   - Migrar metas mensuales/trimestrales a `twelve_week_goals` o nueva tabla
   - Usar hooks existentes para hábitos (`useHabitHistory`)

4. **`Finance.tsx`**
   - Ya existen tablas `wallets`, `transactions`, `loans`
   - Crear hook `useFinanceDB.ts` para usar Supabase

### FASE 3: MEJORAR PÁGINA DE TAREAS

**Nuevas funcionalidades en `Tasks.tsx`:**

1. **Filtro para ocultar completadas:**
```
┌────────────────────────────────────────────────────┐
│ Tareas                         [✓ Ocultar hechas]  │
│                                [+ Nueva Tarea]     │
└────────────────────────────────────────────────────┘
```

2. **Botón de editar en cada tarea:**
```
┌───────────────────────────────────────────────────────┐
│ ☐ Estudiar Física           Alta  📅 30/01  [✏️] [🗑️] │
│   Repasar capítulo 5                                   │
└───────────────────────────────────────────────────────┘
```

3. **Dialog de edición con todos los campos:**
- Título, Descripción, Prioridad, Fecha, Área, Bloque asignado

### FASE 4: REDISEÑAR PLANIFICADOR DEL DÍA

**Nuevo diseño de `DayPlanner.tsx`:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📅 PLANIFICACIÓN                                                │
│ [Hoy] [Mañana]                    Despertar: [5 AM] [6:30 AM]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ➕ CREAR TAREA RÁPIDA                                            │
│ [___Título___] [Universidad ▼] [Media ▼] [+ Crear]              │
│                                                                  │
│ ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│ HORARIO COMPLETO (5 AM - 9 PM)                                  │
│                                                                  │
│ 05:00 ─────────────────────────────────────────────────────────  │
│ │ RUTINA ACTIVACIÓN (30 min)                      [+]          │  │
│                                                                  │
│ 05:30 ─────────────────────────────────────────────────────────  │
│ │ FOCUS EMPRENDIMIENTO (90 min)                   [+]          │  │
│ │  └─ ☑ Revisar métricas                                        │
│ │  └─ ☐ Escribir post LinkedIn                    [×]          │  │
│                                                                  │
│ 07:00 ─────────────────────────────────────────────────────────  │
│ │ GYM (60 min)                                    [+]          │  │
│                                                                  │
│ ... (TODOS los bloques hasta las 21:00) ...                     │
│                                                                  │
│ ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│ TAREAS SIN ASIGNAR (3)                                          │
│ • Estudiar Física        [Universidad] [Asignar a bloque ▼]     │
│ • Landing page           [Emprendimiento] [Asignar a bloque ▼]  │
│                                                                  │
│                                         [💾 GUARDAR PLAN]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Cambios clave:**
1. Mostrar TODOS los bloques (no solo deep work)
2. Agregar creador de tareas rápido
3. Sección de tareas sin asignar al final
4. Simplificar tabs (unificar en vista única)

### FASE 5: NUEVA PÁGINA "ALINEACIÓN DE VIDA"

**Ruta:** `/life-alignment`

**Concepto visual:** Una pirámide/árbol que muestra cómo las acciones diarias alimentan la visión

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         🎯 ALINEACIÓN DE VIDA                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ╔══════════════════╗                           │
│                              ║   MI PROPÓSITO   ║                           │
│                              ║                  ║                           │
│                              ║  CONVERTIRME EN  ║                           │
│                              ║  MI MEJOR VERSIÓN║                           │
│                              ║                  ║                           │
│                              ╚════════╤═════════╝                           │
│                                       │                                     │
│                    ┌──────────────────┴──────────────────┐                  │
│                    │                                     │                  │
│             ╔══════╧══════╗                     ╔════════╧════════╗         │
│             ║  VISIÓN 1   ║                     ║    VISIÓN 2     ║         │
│             ║             ║                     ║                 ║         │
│             ║  IMPERIO &  ║                     ║  FAMILIA CON    ║         │
│             ║  LIBERTAD   ║                     ║  MUJER HERMOSA  ║         │
│             ║  FINANCIERA ║                     ║                 ║         │
│             ╚══════╤══════╝                     ╚════════╤════════╝         │
│                    │                                     │                  │
│      ┌─────────────┼─────────────┐         ┌─────────────┼─────────────┐    │
│      │             │             │         │             │             │    │
│  ┌───┴───┐     ┌───┴───┐    ┌───┴───┐ ┌───┴───┐    ┌───┴───┐    ┌───┴───┐ │
│  │ Univ  │     │ Empr  │    │ Proy  │ │  Gym  │    │Idiomas│    │Música │ │
│  │  80%  │     │  45%  │    │  60%  │ │  90%  │    │  70%  │    │  50%  │ │
│  └───────┘     └───────┘    └───────┘ └───────┘    └───────┘    └───────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 MI PROGRESO HACIA LA MEJOR VERSIÓN                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ANUAL 2026            [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 8%        │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  TRIMESTRE 1           [█████████████████░░░░░░░░░░░░░░░░░░░░░░░] 27%       │
│  Semana 4 de 12                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ENERO 2026            [███████████████████████████████░░░░░░░░░] 90%       │
│  Día 28 de 31                                                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ESTA SEMANA           [████████████████████████████░░░░░░░░░░░░] 72%       │
│  5 de 7 días productivos                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  HOY                   [████████████████████████████████████░░░░] 85%       │
│  7 de 9 actividades completadas                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔗 CONEXIÓN DIARIA → DESTINO                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │   HOY          SEMANA         MES          TRIMESTRE       AÑO     │   │
│  │                                                                     │   │
│  │   ●──────────────●──────────────●──────────────●──────────────●    │   │
│  │   │              │              │              │              │    │   │
│  │   │ 3 tareas     │ 15 tareas    │ 60 tareas    │ Q1: Lanzar   │ 2026│   │
│  │   │ completadas  │ previstas    │ objetivo     │ SiempreVende │ Best│   │
│  │   │              │              │              │              │Version│
│  │   │ 1h gym       │ 5 sesiones   │ 20 sesiones  │ +8kg músculo │     │   │
│  │   │              │              │              │              │     │   │
│  │   │ 68min idiomas│ 10h idiomas  │ 45h idiomas  │ B2 English   │     │   │
│  │   │              │              │              │              │     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📈 PRUEBAS DE QUE ESTOY MEJORANDO                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ESTA SEMANA vs SEMANA PASADA                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Tareas completadas:     28  vs  22     ↑ +27%                     │   │
│  │  Horas de focus:         32h vs  28h    ↑ +14%                     │   │
│  │  Días de gym:             5  vs   4     ↑ +25%                     │   │
│  │  Minutos de idiomas:    420  vs  350    ↑ +20%                     │   │
│  │  Hábitos completados:    85% vs  78%    ↑ +9%                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ESTE MES vs MES PASADO                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Puntuación promedio diaria:  78/100  vs  72/100   ↑ +8%           │   │
│  │  Días productivos:             23/28  vs  19/31    ↑ +32%          │   │
│  │  Metas del 12-Week Year:       4/11   vs   2/11    ↑ +100%         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Estructura de datos para la página:**

```typescript
interface LifeAlignment {
  purpose: {
    statement: string; // "Convertirme en mi mejor versión"
    visions: {
      id: string;
      title: string;
      description: string;
      pillars: string[]; // IDs de categorías que contribuyen
      overallProgress: number;
    }[];
  };
  
  progress: {
    daily: { completed: number; total: number; score: number };
    weekly: { completed: number; total: number; score: number; daysProductive: number };
    monthly: { score: number; daysProductive: number; goalsAchieved: number };
    quarterly: { weekNumber: number; goalsProgress: GoalProgress[] };
    annual: { percentComplete: number; milestones: Milestone[] };
  };
  
  comparisons: {
    thisWeekVsLast: MetricComparison[];
    thisMonthVsLast: MetricComparison[];
  };
  
  dailyAlignment: {
    todayTasks: AlignedTask[];
    contributionToVision: number; // 0-100
  };
}
```

---

## ARCHIVOS A CREAR

1. **`src/pages/LifeAlignment.tsx`** - Nueva página de alineación de vida
2. **`src/components/life-alignment/VisionPyramid.tsx`** - Visualización de pirámide propósito-visiones-pilares
3. **`src/components/life-alignment/ProgressTimeline.tsx`** - Línea de tiempo diario→anual
4. **`src/components/life-alignment/ImprovementProofs.tsx`** - Comparaciones semana/mes
5. **`src/components/life-alignment/DailyContribution.tsx`** - Cómo hoy contribuye al destino
6. **`src/hooks/useLifeAlignment.ts`** - Hook para calcular todas las métricas

## ARCHIVOS A MODIFICAR

1. **`src/App.tsx`** - Agregar ruta `/life-alignment`
2. **`src/components/Navigation.tsx`** - Agregar enlace a nueva página
3. **`src/pages/Tasks.tsx`** - Agregar filtro, edición, quitar auth
4. **`src/pages/DayPlanner.tsx`** - Rediseño completo con todos los bloques
5. **`src/components/routine/BlockTaskPlanner.tsx`** - Mostrar todos los bloques
6. **`src/pages/Projects.tsx`** - Migrar de localStorage a Supabase
7. **`src/pages/Finance.tsx`** - Migrar de localStorage a Supabase
8. **`src/pages/ControlRoom.tsx`** - Migrar de localStorage a Supabase
9. **`src/hooks/useRoutineBlocks.ts`** - Deprecar, usar useRoutineBlocksDB

## MIGRACIONES SQL

```sql
-- 1. Cambiar RLS de tasks a "Allow all"
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- 2. Hacer lo mismo para projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- 3. goals, goal_tasks, goal_block_connections
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;
CREATE POLICY "Allow all access to goals" ON goals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own goal tasks" ON goal_tasks;
DROP POLICY IF EXISTS "Users can create their own goal tasks" ON goal_tasks;
DROP POLICY IF EXISTS "Users can update their own goal tasks" ON goal_tasks;
DROP POLICY IF EXISTS "Users can delete their own goal tasks" ON goal_tasks;
CREATE POLICY "Allow all access to goal_tasks" ON goal_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own goal block connections" ON goal_block_connections;
DROP POLICY IF EXISTS "Users can create their own goal block connections" ON goal_block_connections;
DROP POLICY IF EXISTS "Users can update their own goal block connections" ON goal_block_connections;
DROP POLICY IF EXISTS "Users can delete their own goal block connections" ON goal_block_connections;
CREATE POLICY "Allow all access to goal_block_connections" ON goal_block_connections FOR ALL USING (true) WITH CHECK (true);

-- 4. exams y university_subjects
DROP POLICY IF EXISTS "Users can view their own exams" ON exams;
DROP POLICY IF EXISTS "Users can create their own exams" ON exams;
DROP POLICY IF EXISTS "Users can update their own exams" ON exams;
DROP POLICY IF EXISTS "Users can delete their own exams" ON exams;
CREATE POLICY "Allow all access to exams" ON exams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own subjects" ON university_subjects;
DROP POLICY IF EXISTS "Users can create their own subjects" ON university_subjects;
DROP POLICY IF EXISTS "Users can update their own subjects" ON university_subjects;
DROP POLICY IF EXISTS "Users can delete their own subjects" ON university_subjects;
CREATE POLICY "Allow all access to university_subjects" ON university_subjects FOR ALL USING (true) WITH CHECK (true);

-- 5. user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can create their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;
CREATE POLICY "Allow all access to user_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);

-- 6. Hacer user_id nullable en tablas que lo requieran
ALTER TABLE tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE goal_tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE goal_block_connections ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE exams ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE university_subjects ALTER COLUMN user_id DROP NOT NULL;
```

---

## ORDEN DE IMPLEMENTACIÓN

1. **Fase 1: Arreglar RLS** (crítico para sincronización)
   - Ejecutar migración SQL
   - Modificar código para no requerir auth

2. **Fase 2: Mejorar Tareas**
   - Agregar filtro ocultar completadas
   - Agregar botón editar
   - Dialog de edición

3. **Fase 3: Rediseñar Planificador**
   - Mostrar todos los bloques
   - Agregar creador de tareas
   - Sección tareas sin asignar

4. **Fase 4: Migrar localStorage**
   - useRoutineBlocks → useRoutineBlocksDB
   - Projects, Finance, ControlRoom a Supabase

5. **Fase 5: Página Alineación de Vida**
   - Crear componentes visuales
   - Crear hook de métricas
   - Integrar en navegación

