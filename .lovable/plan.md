

# Plan: Timeline Mejorado y Tracker de Constancia Interactivo

## RESUMEN DE CAMBIOS

### 1. Timeline del Día por Hora y Bloques
- Vista por hora con bloques de tiempo visuales
- Tareas visibles dentro de cada bloque
- Línea horizontal marcando la hora actual
- Marcar bloques como completados/no completados
- Marcar tareas como hechas/pendientes
- Mover tareas entre bloques (drag & drop o selector)
- Configuración de inicio de rutina (5 AM o 6:30 AM)

### 2. Tracker de Constancia Interactivo
- Métricas basadas en datos reales:
  - Universidad: tareas completadas + tiempo dedicado
  - Emprendimiento: tareas completadas
  - Proyecto: tareas completadas
  - Gym: tiempo dedicado (1 hora)
  - Idiomas: min 30 min, max 1.5h
  - Piano/Guitarra: juntos, 30 min (uno u otro)
  - Ajedrez: 1 partida
  - Lectura: 30 min
- Tap para completar (se pone verde)
- Tap de nuevo para agregar más tiempo (bonus)
- Opción para desmarcar

---

## DETALLES TÉCNICOS

### Nuevo Componente: `EnhancedDayTimeline.tsx`

Reemplaza `DayTimeline.tsx` con funcionalidad mejorada:

```
┌────────────────────────────────────────────────────────────────┐
│  ⏰ TIMELINE DEL DÍA            [5:00 AM ▼] [6:30 AM]          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  05:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  │                                                              │
│  │  RUTINA ACTIVACIÓN (30 min)               ✅ Completado     │
│  │  └─ [✓] Meditación                                          │
│  │  └─ [✓] Estiramientos                                       │
│  │                                                              │
│  05:30 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  │                                                              │
│  │  FOCUS - EMPRENDIMIENTO (90 min)          ⬜ Pendiente      │
│  │  └─ [✓] Revisar métricas del día anterior                   │
│  │  └─ [ ] Escribir post de LinkedIn              [→ Mover]    │
│  │  └─ [ ] Configurar automatización              [→ Mover]    │
│  │                                                              │
│  07:00 ━━━━━━━━ AHORA 07:23 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  │      ▲                                                       │
│  │  GYM (60 min)                             ⬜ En progreso    │
│  │  └─ [Ejercicios de hoy]                                     │
│  │                                                              │
│  08:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  ...                                                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Características:**
1. Selector de hora de inicio (5:00 AM / 6:30 AM) en el header
2. Vista por horas con marcadores cada hora
3. Bloques visuales con duración proporcional
4. Línea "AHORA" que atraviesa el timeline en la hora actual
5. Checkbox para completar bloques
6. Tareas listadas dentro de cada bloque con toggle
7. Botón "Mover" en cada tarea para reasignar a otro bloque

**Estado del Bloque:**
- `⬜ Pendiente` - Bloque no iniciado
- `🔄 En progreso` - Bloque actual
- `✅ Completado` - Bloque terminado
- `⚠️ Parcial` - Algunas tareas sin completar

---

### Nuevo Componente: `InteractiveConsistencyTracker.tsx`

Reemplaza `ConsistencyTracker.tsx` con interactividad:

```
┌────────────────────────────────────────────────────────────────┐
│  📊 MI CONSTANCIA HOY                           78/100 pts    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PILARES PRINCIPALES                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🎓 Universidad    │ 3 tareas │ 2.5h    │🔥5 │ [VERDE]   │  │
│  │ 💼 Emprendimiento │ 2 tareas │         │🔥3 │ [VERDE]   │  │
│  │ 🚀 Proyecto       │ 1 tarea  │         │🔥7 │ [VERDE]   │  │
│  │ 💪 Gym            │ 45min/1h │         │🔥12│ [AMARILLO]│  │
│  │ 🌍 Idiomas        │ 68min    │ min:30  │🔥8 │ [VERDE]   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  METAS SECUNDARIAS                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │ 🎹🎸 Música     │ │ ♟️ Ajedrez      │ │ 📖 Lectura     │  │
│  │   30 min        │ │  1 partida      │ │  30 min         │  │
│  │   [TAP VERDE]   │ │  [TAP VERDE]    │ │  [TAP GRIS]     │  │
│  │   +15min bonus  │ │                 │ │                 │  │
│  │   [DESMARCAR]   │ │  [DESMARCAR]    │ │                 │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│                                                                 │
│  🎬 Game of Thrones [TAP GRIS]                                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Interactividad por Actividad:**

| Actividad | Métrica Base | Tap 1 | Tap 2+ | Color | Desmarcar |
|-----------|--------------|-------|--------|-------|-----------|
| Universidad | Tareas + Tiempo | Auto | +tiempo | Verde si tareas > 0 AND tiempo > 1h | ✓ |
| Emprendimiento | Tareas | Auto | - | Verde si tareas > 0 | ✓ |
| Proyecto | Tareas | Auto | - | Verde si tareas > 0 | ✓ |
| Gym | 1h objetivo | Completar | +tiempo | Verde = 1h+, Amarillo = 30-60min | ✓ |
| Idiomas | 30-90 min | Completar | +tiempo | Verde = 30min+, Amarillo = <30 | ✓ |
| Piano/Guitarra | 30 min (uno) | Completar | +tiempo | Verde | ✓ |
| Ajedrez | 1 partida | Completar | - | Verde | ✓ |
| Lectura | 30 min | Completar | +tiempo | Verde | ✓ |
| GoT | 1 capítulo | Completar | - | Verde | ✓ |

**Estados visuales:**
- Gris: No completado
- Verde: Completado/Cumplido
- Amarillo: Parcial (ej. gym 30 min)
- Verde con borde dorado: Bonus (tiempo extra)

---

## MODIFICACIONES A LA BASE DE DATOS

### Nueva tabla: `activity_tracking`

```sql
CREATE TABLE activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT NOT NULL, -- 'gym', 'idiomas', 'piano', 'guitarra', 'ajedrez', 'lectura', 'got'
  duration_minutes INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  bonus_minutes INTEGER DEFAULT 0, -- Tiempo extra añadido
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(activity_date, activity_type)
);

ALTER TABLE activity_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to activity_tracking" 
  ON activity_tracking FOR ALL 
  USING (true) WITH CHECK (true);
```

### Nueva tabla: `block_completions`

```sql
CREATE TABLE block_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  block_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  tasks_completed INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(completion_date, block_id)
);

ALTER TABLE block_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to block_completions" 
  ON block_completions FOR ALL 
  USING (true) WITH CHECK (true);
```

---

## ARCHIVOS A CREAR

1. **`src/components/today/EnhancedDayTimeline.tsx`**
   - Selector de hora de inicio (5 AM / 6:30 AM)
   - Vista por horas con bloques proporcionales
   - Línea "AHORA" que cruza el timeline
   - Toggle de completar bloques
   - Toggle de completar tareas
   - Selector para mover tareas entre bloques

2. **`src/components/today/InteractiveConsistencyTracker.tsx`**
   - Cards clickeables para cada actividad
   - Toggle tap para completar
   - Long press o segundo tap para agregar bonus
   - Botón de desmarcar
   - Colores dinámicos según estado

3. **`src/hooks/useActivityTracking.ts`**
   - CRUD para `activity_tracking` table
   - Métodos: `markComplete()`, `addBonusTime()`, `unmark()`, `getStatus()`

4. **`src/hooks/useBlockCompletions.ts`**
   - CRUD para `block_completions` table
   - Métodos: `markBlockComplete()`, `getBlockStatus()`, `toggleBlock()`

---

## ARCHIVOS A MODIFICAR

1. **`src/pages/Index.tsx`**
   - Reemplazar `DayTimeline` con `EnhancedDayTimeline`
   - Reemplazar `ConsistencyTracker` con `InteractiveConsistencyTracker`

2. **`src/components/today/TodayTasks.tsx`**
   - Agregar función para mover tarea a otro bloque
   - Callback para sincronizar con timeline

---

## LÓGICA DE CÁLCULO DE MÉTRICAS

### Universidad
```typescript
// Tareas: tasks.filter(t => t.area_id === 'universidad' && t.completed).length
// Tiempo: Suma de duración de bloques Deep Work con focus='universidad' completados
const universityTasks = todayTasks.filter(t => 
  t.area_id === 'universidad' && t.completed
).length;
const universityHours = completedBlocks
  .filter(b => b.currentFocus === 'universidad')
  .reduce((sum, b) => sum + getBlockDurationMinutes(b) / 60, 0);
const isComplete = universityTasks > 0 && universityHours >= 1;
```

### Emprendimiento
```typescript
const entrepreneurshipTasks = await supabase
  .from('entrepreneurship_tasks')
  .select('*')
  .eq('completed', true)
  .eq('due_date', today);
const isComplete = entrepreneurshipTasks.length > 0;
```

### Proyecto
```typescript
const projectTasks = todayTasks.filter(t => 
  t.area_id === 'proyectos-personales' && t.completed
).length;
const isComplete = projectTasks > 0;
```

### Gym (desde activity_tracking)
```typescript
const gymActivity = await getActivity('gym', today);
// Verde: duration >= 60 min
// Amarillo: 30 <= duration < 60
// Gris: < 30 o no completado
```

### Idiomas (desde language_sessions + activity_tracking)
```typescript
const languageSession = await supabase
  .from('language_sessions')
  .select('total_duration')
  .eq('session_date', today);
const duration = languageSession?.total_duration || 0;
// Verde: duration >= 30
// Amarillo: 15 <= duration < 30
// Bonus: duration > 90
```

### Piano/Guitarra (uno u otro)
```typescript
const musicActivity = await getActivity(['piano', 'guitarra'], today);
// Solo uno puede estar completado por día
// Verde si cualquiera tiene completed = true && duration >= 30
```

---

## FLUJO DE INTERACCIÓN

### Completar Actividad (Tap Simple)
1. Usuario toca card de actividad
2. Si no completada → marcar como completada con duración base
3. Card cambia a verde
4. Actualizar puntuación

### Agregar Bonus (Tap Adicional)
1. Usuario toca card ya completada
2. Mostrar dialog "¿Agregar tiempo extra?"
3. Input numérico para minutos adicionales
4. Guardar bonus_minutes en activity_tracking
5. Mostrar borde dorado en card

### Desmarcar Actividad
1. Usuario mantiene presionado o tap en ícono ✗
2. Confirmar acción
3. Resetear completed = false, bonus_minutes = 0
4. Card vuelve a gris

### Mover Tarea en Timeline
1. Usuario tap en botón [→] de tarea
2. Mostrar selector de bloques disponibles
3. Actualizar routine_block_id en tasks/entrepreneurship_tasks
4. Refrescar timeline

### Toggle Bloque Completado
1. Usuario tap en checkbox de bloque
2. Guardar en block_completions
3. Actualizar visual del bloque (tachado o destacado)

---

## ORDEN DE IMPLEMENTACIÓN

1. **Fase 1: Base de datos**
   - Crear tablas `activity_tracking` y `block_completions`
   
2. **Fase 2: Hooks**
   - Crear `useActivityTracking.ts`
   - Crear `useBlockCompletions.ts`
   
3. **Fase 3: Timeline Mejorado**
   - Crear `EnhancedDayTimeline.tsx`
   - Implementar selector de hora inicio
   - Línea de hora actual
   - Toggle de tareas y bloques
   - Mover tareas
   
4. **Fase 4: Constancia Interactiva**
   - Crear `InteractiveConsistencyTracker.tsx`
   - Lógica de tap/completar
   - Agregar bonus
   - Desmarcar
   - Colores dinámicos
   
5. **Fase 5: Integración**
   - Actualizar Index.tsx
   - Sincronizar componentes
   - Probar flujos completos

