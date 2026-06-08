# Plan de cambios

## 1. Página Sistemas

### 1.1 Entrenamiento como checklist
- En `SystemHabitGroup` / sección de entrenamiento del `Systems.tsx`, añadir un checklist integrado igual al de Lectura, Música y Ajedrez (hecho/no hecho, con su `WeekStreakBar` y color rojo/azul/verde según umbral).
- Reutilizar `HobbyCards` o crear una tarjeta `WorkoutCheckCard` con el mismo patrón visual.

### 1.2 Idiomas en una sola tarjeta
- Modificar `LanguageSkillCards.tsx`: encerrar las 6 habilidades dentro de **una sola tarjeta contenedora** ("🌐 Idiomas").
- Quitar el conteo de tiempo (30m) — solo checkbox por habilidad (hecha / no hecha).
- Mantener un solo `WeekStreakBar` global de idiomas (ya existe).

### 1.3 Sección Foco
- En la sección Foco de Sistemas, agregar un botón "+ Nueva tarea" que abre un diálogo rápido para crear tarea en `tasks` con `area_id`.
- Mostrar bajo Foco las tareas del día agrupadas por área: **Universidad, Emprendimiento, Proyectos, Tareas** (cada una colapsable) con su lista filtrada por `area_id`.

### 1.4 Bloques de trabajo: 1.30h ↔ 3x30m
- En `WorkBlockSquares.tsx`, añadir por bloque un toggle "Unificar / Dividir":
  - Modo unificado: una sola caja de 1h30 (estilo bloque completo, asignable a un área/tarea).
  - Modo dividido: las 3 cajas de 30m actuales.
- Persistir el modo por bloque en `daily_systems_tracking.block_modes` (JSON nuevo) o reutilizar `work_assignments`.

### 1.5 Horario del día: Rutina Normal vs Rutina 5AM
- En el `PresetSchedulePicker` del Systems, ofrecer dos opciones rápidas:
  - **Rutina Normal** (la actual).
  - **Rutina 5AM**: 5:00–5:30 inicio, 5:30–7:00 activación, 7:00–8:00 gym, 8:00–8:30 alistamiento+desayuno, y el resto igual a la normal.
- Insertar el preset `Rutina 5AM` en `routine_presets` si no existe.

## 2. Nueva página Plan Identidad (`/plan-identidad`)

- Crear `src/pages/PlanIdentidad.tsx` y ruta en `App.tsx`. Añadir entrada en `Navigation`.
- **Mover** `IdentityPlan` desde Systems a esta página (quitar de `Systems.tsx`).

### 2.1 Punto B con tareas y subtareas
- Migración: nueva tabla `identity_plan_tasks`:
  - `id`, `identity_plan_id` (FK), `title`, `is_primary` (boolean), `parent_task_id` (FK self, para subtareas), `completed`, `order_index`, `created_at`, `updated_at`.
  - GRANT a authenticated/service_role, RLS `USING (true)` (en línea con el resto del proyecto sin auth).
- Reemplazar el campo de texto Punto B por una lista de tareas:
  - Cada tarea con check, botón "Marcar como principal" y permite subtareas anidadas.
  - Barra de progreso = subtareas/tareas completadas.
- El campo `point_b` queda como título-resumen opcional.

### 2.2 Sección "Mi Porqué" (Vision Board 3x3)
- Debajo del Plan Identidad, grid 3x3 de tarjetas grandes.
- Cada tarjeta permite subir foto desde galería (bucket `user-images`).
- Persistencia: tabla `vision_board_cells` con `id`, `board_type` ('porque' | 'recompensas'), `position` (0–8), `image_url`, `caption`.

### 2.3 Sección "Recompensas" (Vision Board 3x3)
- Idéntico al de Mi Porqué, debajo, con `board_type='recompensas'`.

## Detalles técnicos

```text
/plan-identidad
├── IdentityPlan (movido de Systems)
│   └── por cada área: Punto A | Punto B (tareas + subtareas) | Progreso
├── Mi Porqué (Vision Board 3x3)
└── Recompensas (Vision Board 3x3)
```

### Migraciones SQL
1. `identity_plan_tasks` (tareas/subtareas del Punto B).
2. `vision_board_cells` (9 celdas × 2 boards).
3. Insertar preset `Rutina 5AM` en `routine_presets`.

### Archivos a crear
- `src/pages/PlanIdentidad.tsx`
- `src/components/identity/IdentityTaskList.tsx` (tareas+subtareas)
- `src/components/identity/VisionBoardGrid3x3.tsx` (reutilizable porqué/recompensas)
- `src/components/systems/WorkoutCheckCard.tsx` (entrenamiento checklist)
- `src/components/systems/FocusTasksPanel.tsx` (tareas por área + crear)

### Archivos a editar
- `src/pages/Systems.tsx` — quitar IdentityPlan, añadir Workout check, FocusTasksPanel, toggle bloques.
- `src/components/systems/LanguageSkillCards.tsx` — tarjeta única sin tiempos.
- `src/components/systems/WorkBlockSquares.tsx` — toggle 1.30h/3x30m.
- `src/components/routine/PresetSchedulePicker.tsx` — opciones Normal / 5AM.
- `src/App.tsx`, `src/components/Navigation.tsx` — nueva ruta.

¿Procedo a implementarlo?
