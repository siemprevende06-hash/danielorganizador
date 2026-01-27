

## Plan: Mejoras Integrales del Sistema - Alimentación, Rutina, Navegación y Sincronización

### RESUMEN DE CAMBIOS SOLICITADOS

1. **Nuevo bloque de Alimentación** debajo del bloque actual en la página de inicio
2. **Cambios en la rutina**: Idiomas a 5:30-7:00 PM, Focus a 5:30-7:00 AM
3. **Nueva opción de despertar 6:30 AM** con rutina reducida
4. **Menú hamburguesa deslizable** para móvil/tablet
5. **Arreglar planificación diaria** (crear tareas, asignar a bloques)
6. **Sección de constancia clara** en inicio (universidad, emprendimiento, gym, etc.)
7. **Migrar localStorage a base de datos** para sincronización entre dispositivos

---

### 1. NUEVO SISTEMA DE ALIMENTACIÓN

#### Nueva tabla en la base de datos: `meal_tracking`

```sql
CREATE TABLE meal_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL, -- 'pre_entreno', 'desayuno', 'merienda_1', 'almuerzo', 'merienda_2', 'comida', 'merienda_nocturna'
  scheduled_time TIME NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Nuevo componente: `MealTracker.tsx`

Horario de comidas definido:
| Comida | Hora | Descripción |
|--------|------|-------------|
| pre_entreno | 05:30 | Merienda pre-entreno |
| desayuno | 08:00 | Desayuno fuerte post-entreno |
| merienda_1 | 10:30 | Merienda |
| almuerzo | 13:20 | Almuerzo |
| merienda_2 | 16:00 | Merienda |
| comida | 19:00 | Comida |
| merienda_nocturna | 20:40 | Merienda antes de dormir |

Visualización:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🍽️ ALIMENTACIÓN                           Meta: 50kg → 70kg    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRÓXIMA COMIDA: 🍳 Almuerzo en 45 min (1:20 PM)               │
│                                                                 │
│  ✅ 05:30  Merienda pre-entreno                                │
│  ✅ 08:00  Desayuno fuerte                                     │
│  ✅ 10:30  Merienda                                            │
│  🔔 13:20  Almuerzo                    ← PRÓXIMA               │
│  ⏳ 16:00  Merienda                                            │
│  ⏳ 19:00  Comida                                              │
│  ⏳ 20:40  Merienda nocturna                                   │
│                                                                 │
│  Progreso hoy: ███████░░░░░░░░ 3/7 comidas (43%)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Archivos a crear:**
- `src/components/today/MealTracker.tsx`
- `src/hooks/useMealTracking.ts`

**Archivos a modificar:**
- `src/pages/Index.tsx` - Agregar `MealTracker` después de `CurrentBlockHighlight`

---

### 2. CAMBIOS EN LA RUTINA: INTERCAMBIO DE BLOQUES

#### Modificaciones en `routine_blocks`:

**Cambio 1: Bloque de Idiomas (block_id: 2)**
- ANTES: 05:30 - 07:00 AM
- DESPUÉS: 17:30 - 19:00 PM (5:30 - 7:00 PM)

**Cambio 2: Bloque Focus (block_id: 14)**
- ANTES: 17:30 - 19:00 PM
- DESPUÉS: 05:30 - 07:00 AM

**Cambio 3: Bloque Ocio (block_id: 15)**
- ANTES: 19:00 - 20:00
- DESPUÉS: 19:00 - 19:30 (ajuste para hacer espacio)

**Cambio 4: Nuevo orden de bloques mañana:**
1. 05:00 - 05:30: Rutina Activación
2. 05:30 - 07:00: Focus (antes era Idiomas)
3. 07:00 - 08:00: Gym
4. ...continúa igual

**Cambio 5: Nuevo orden tarde:**
14. 17:30 - 19:00: Idiomas + Lectura (movido desde la mañana)
15. 19:00 - 19:30: Ocio (reducido)
16. 19:30 - 20:00: Piano o Guitarra (ajustado)
17. 20:00 - 20:30: Rutina Desactivación (ajustado)

**Migración SQL requerida**

---

### 3. OPCIÓN DE DESPERTAR A LAS 6:30 AM

#### Nuevo preset en `routine_presets`:

```
Nombre: "Sueño Extendido 6:30"
Descripción: "Despertar a las 6:30, rutina reducida"
wake_time: 06:30
sleep_time: 21:00
excluded_block_ids: ['2'] -- Excluye Focus matutino
modified_blocks: {
  '1': { start_time: '06:30', end_time: '07:00' },  // Activación 30 min
  '3': { start_time: '07:00', end_time: '08:00' }   // Gym igual
}
```

**Estructura de la mañana con 6:30:**
| Hora | Bloque |
|------|--------|
| 06:30 - 07:00 | Rutina Activación |
| 07:00 - 08:00 | Gym |
| 08:00 - 08:30 | Alistamiento + Desayuno |
| 08:30 - 09:00 | Viaje CUJAE |
| 09:00 → | Continúa igual |

**Archivos a modificar:**
- `src/hooks/useRoutinePresets.ts` - Agregar lógica para preset 6:30
- `src/components/routine/SleepTimeSelector.tsx` - Agregar botón rápido "6:30 AM"
- `src/pages/DayPlanner.tsx` - Soportar el nuevo preset

---

### 4. MENÚ HAMBURGUESA DESLIZABLE (MOBILE/TABLET)

#### Problema actual:
El Sheet content no tiene scroll, los items inferiores no son accesibles.

#### Solución en `Navigation.tsx`:

```tsx
<SheetContent side="right" className="w-64 p-0 flex flex-col h-full">
  <ScrollArea className="flex-1 h-full">
    <div className="flex flex-col gap-1 p-4 pt-10 pb-20">
      {navItems.map((item) => renderNavItem(item, true))}
    </div>
  </ScrollArea>
</SheetContent>
```

**Cambios:**
1. Importar `ScrollArea` de `@/components/ui/scroll-area`
2. Envolver contenido en `ScrollArea` con `h-full`
3. Agregar `pb-20` para safe area inferior
4. Agregar `overflow-hidden` al SheetContent

---

### 5. ARREGLAR PLANIFICACIÓN DIARIA

#### Problemas identificados en `BlockTaskPlanner.tsx`:

1. **Las tareas de emprendimiento no tienen `routine_block_id`** - No se pueden asignar a bloques
2. **No se cargan todas las tareas** - Solo carga tasks, no entrepreneurship_tasks con el campo correcto

#### Soluciones:

**A. Agregar columna a `entrepreneurship_tasks`:**
```sql
ALTER TABLE entrepreneurship_tasks 
ADD COLUMN routine_block_id TEXT;
```

**B. Modificar `BlockTaskPlanner.tsx`:**
- Mejorar `loadAllTasks()` para incluir university subjects
- Modificar `saveAssignments()` para guardar también en entrepreneurship_tasks
- Agregar botón para crear nueva tarea rápida desde el planificador

**C. Modificar `DayPlanner.tsx`:**
- Agregar diálogo para crear tarea rápida
- Cargar tareas de todas las fuentes correctamente
- Mostrar asignaturas/temas en las tareas de universidad

---

### 6. SECCIÓN DE CONSTANCIA EN INICIO

#### Nuevo componente: `ConsistencyTracker.tsx`

Visualización clara de actividades diarias:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 MI CONSTANCIA HOY                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PILARES PRINCIPALES:                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎓 Universidad    │ 4.5h estudio │ 3 tareas ✅ │ Racha: 5 │   │
│  │ 💼 Emprendimiento │ 1 tarea ✅    │ +2h focus   │ Racha: 3 │   │
│  │ 🚀 Proyecto       │ 2 tareas ✅   │ En progreso │ Racha: 7 │   │
│  │ 💪 Gym            │ ✅ Completado │ 45 min      │ Racha: 12│   │
│  │ 🌍 Idiomas        │ 4/5 sub ✅    │ 68 min      │ Racha: 8 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  METAS SECUNDARIAS:                                            │
│  🎹 Piano: ✅ 30 min  │  🎸 Guitarra: ⏳        │               │
│  📖 Lectura: ✅ 20 min│  ♟️ Ajedrez: ✅ 1 partida│               │
│                                                                 │
│  EXTRAS:                                                       │
│  🎬 Game of Thrones: ⏳ Pendiente                               │
│                                                                 │
│  PUNTUACIÓN DEL DÍA: 78/100 ████████████████░░░░               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Métricas por área (datos reales de la BD):**

| Área | Fuente de Datos | Métrica |
|------|-----------------|---------|
| Universidad | `tasks` (area_id='universidad'), `exams` | Horas, tareas completadas |
| Emprendimiento | `entrepreneurship_tasks` | Tareas completadas |
| Proyecto | `tasks` (area_id='proyectos-personales') | Tareas completadas |
| Gym | `habit_history` (habit-entrenamiento), `exercise_logs` | Completado, duración |
| Idiomas | `language_sessions` | Sub-tareas, minutos |
| Piano | `habit_history` (habit-piano) | Completado, duración |
| Guitarra | `habit_history` (habit-guitarra) | Completado, duración |
| Lectura | `language_sessions.reading_completed` | Completado, duración |
| Ajedrez | `habit_history` (habit-ajedrez) | Completado |
| GoT | Nueva entrada en `habit_history` | Completado |

**Archivos a crear:**
- `src/components/today/ConsistencyTracker.tsx`

**Archivos a modificar:**
- `src/pages/Index.tsx` - Agregar después de PillarProgressGrid
- `src/hooks/usePillarProgress.ts` - Agregar tracking de GoT

---

### 7. MIGRACIÓN DE LOCALSTORAGE A BASE DE DATOS

#### Archivos que usan localStorage (a migrar):

| Archivo | Datos | Nueva tabla/campo |
|---------|-------|-------------------|
| `usePerformanceModes.ts` | Modos de rendimiento | `routine_presets` (ya existe) |
| `useRoutineBlocks.ts` | Bloques activos | `routine_blocks` (ya existe) |
| `DailyRoutine.tsx` | Streaks, planes diarios | `routine_completions`, `daily_plans` |
| `HabitTrackerMain.tsx` | Rewards/punishments balance | Nueva columna en `user_settings` |
| `Projects.tsx` | Proyectos locales | `projects` (ya existe, migrar datos) |
| `ControlRoom.tsx` | Monthly/quarterly goals | `twelve_week_goals` (ya existe) |
| `VisionGoalsBoard.tsx` | Vision cards | `vision_boards` (ya existe) |
| `Tools.tsx` | Ideal partner vision | `vision_boards` (usar board_type) |

#### Cambios requeridos:

**A. Nueva migración de datos:**
```sql
-- Agregar campos para gamificación en user_settings
ALTER TABLE user_settings
ADD COLUMN rewards_balance INTEGER DEFAULT 0,
ADD COLUMN punishments_balance INTEGER DEFAULT 0;
```

**B. Modificar hooks para usar Supabase:**

1. **`usePerformanceModes.ts`**
   - Cambiar de localStorage a `routine_presets`
   - Agregar migración automática de datos locales

2. **`useRoutineBlocks.ts`**
   - Ya existe `useRoutineBlocksDB.ts` - usar este en su lugar
   - Actualizar imports en archivos que usan el hook antiguo

3. **`DailyRoutine.tsx`**
   - Usar `useRoutineCompletions` para streaks
   - Usar `daily_plans` para planes diarios

4. **`Projects.tsx`**
   - Migrar a usar tabla `projects` de Supabase
   - Crear hook `useProjects.ts`

5. **`HabitTrackerMain.tsx`**
   - Guardar rewards/punishments en `user_settings`

**C. Agregar lógica de migración one-time:**
```typescript
// En cada hook afectado
const migrateFromLocalStorage = async () => {
  const localData = localStorage.getItem(KEY);
  if (localData) {
    // Migrar a Supabase
    await supabase.from('table').insert(JSON.parse(localData));
    // Limpiar localStorage
    localStorage.removeItem(KEY);
  }
};
```

---

### ARCHIVOS A CREAR

1. `src/components/today/MealTracker.tsx` - Tracker de alimentación
2. `src/hooks/useMealTracking.ts` - Hook para gestión de comidas
3. `src/components/today/ConsistencyTracker.tsx` - Vista de constancia

### ARCHIVOS A MODIFICAR

1. `src/pages/Index.tsx` - Agregar MealTracker y ConsistencyTracker
2. `src/components/Navigation.tsx` - Agregar ScrollArea al Sheet
3. `src/pages/DayPlanner.tsx` - Mejorar asignación de tareas
4. `src/components/routine/BlockTaskPlanner.tsx` - Soportar todas las fuentes de tareas
5. `src/hooks/usePerformanceModes.ts` - Migrar a Supabase
6. `src/hooks/useRoutineBlocks.ts` - Migrar a Supabase (o deprecar)
7. `src/pages/DailyRoutine.tsx` - Migrar localStorage
8. `src/components/habits/HabitTrackerMain.tsx` - Guardar en BD
9. `src/pages/Projects.tsx` - Migrar a Supabase
10. `src/hooks/usePillarProgress.ts` - Agregar GoT y mejorar cálculos

### MIGRACIONES SQL

```sql
-- 1. Tabla de seguimiento de alimentación
CREATE TABLE meal_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL,
  scheduled_time TIME NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. RLS permisiva para meal_tracking
ALTER TABLE meal_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to meal_tracking" ON meal_tracking FOR ALL USING (true) WITH CHECK (true);

-- 3. Agregar routine_block_id a entrepreneurship_tasks
ALTER TABLE entrepreneurship_tasks ADD COLUMN routine_block_id TEXT;

-- 4. Agregar campos de gamificación a user_settings
ALTER TABLE user_settings 
ADD COLUMN rewards_balance INTEGER DEFAULT 0,
ADD COLUMN punishments_balance INTEGER DEFAULT 0;

-- 5. Actualizar horarios de bloques (Idiomas y Focus intercambiados)
UPDATE routine_blocks SET start_time = '17:30', end_time = '19:00', order_index = 14 WHERE block_id = '2';
UPDATE routine_blocks SET start_time = '05:30', end_time = '07:00', order_index = 2 WHERE block_id = '14';

-- 6. Actualizar nombre del bloque de Idiomas para claridad
UPDATE routine_blocks SET title = 'Idiomas (Tarde)' WHERE block_id = '2';

-- 7. Actualizar nombre del bloque Focus para claridad  
UPDATE routine_blocks SET title = 'Focus (Mañana)' WHERE block_id = '14';

-- 8. Agregar preset de 6:30 AM
INSERT INTO routine_presets (name, description, wake_time, sleep_time, excluded_block_ids, is_default, icon)
VALUES (
  'Sueño Extendido 6:30',
  'Despertar a las 6:30, sin bloque Focus matutino',
  '06:30',
  '21:00',
  ARRAY['14'],
  false,
  'moon'
);
```

---

### ORDEN DE IMPLEMENTACIÓN

1. **Fase 1: Base de datos**
   - Ejecutar migraciones SQL

2. **Fase 2: Alimentación**
   - Crear `useMealTracking.ts`
   - Crear `MealTracker.tsx`
   - Integrar en Index.tsx

3. **Fase 3: Navegación**
   - Modificar Navigation.tsx con ScrollArea

4. **Fase 4: Planificación**
   - Arreglar BlockTaskPlanner.tsx
   - Mejorar DayPlanner.tsx

5. **Fase 5: Constancia**
   - Crear ConsistencyTracker.tsx
   - Mejorar usePillarProgress.ts

6. **Fase 6: Migración de datos**
   - Actualizar cada hook para usar Supabase
   - Agregar lógica de migración one-time
   - Probar sincronización entre dispositivos

