# Plan de mejoras

## 1. PWA instalable y 100% offline

- Activar `vite-plugin-pwa` con `registerType: "autoUpdate"` y `generateSW` (Workbox).
- Manifest completo en `public/manifest.webmanifest` con `display: standalone`, iconos 192/512 (ya existentes), `theme_color`, `background_color`, `start_url: "/"`.
- Estrategias de caché:
  - **App shell / JS / CSS / fuentes**: `CacheFirst` (assets hasheados, mismo origen).
  - **Navegaciones HTML**: `NetworkFirst` con fallback al shell cacheado.
  - **Imágenes subidas a Supabase Storage** (`user-images`): `CacheFirst` con expiración (30 días, máx 200 entradas).
  - **Llamadas a Supabase REST/RPC**: `NetworkFirst` con fallback a caché (TTL 7 días) para que la app abra sin internet con los últimos datos.
- Registro del SW envuelto en guardas (no registrar en preview de Lovable / iframes / dev), kill-switch `?sw=off`.
- Cola offline ya existe (`src/lib/offlineQueue.ts`) — la integramos para reintentar escrituras (toggles, completaciones, tareas) cuando vuelve la red.
- Resultado: al abrir la app sin internet carga la última versión y muestra datos e imágenes cacheados; los cambios se sincronizan al reconectarse.

## 2. Página Tareas con pestañas por área real

- Refactor de `src/pages/Tasks.tsx`: añadir `<Tabs>` con pestañas:
  - **Universidad** (tareas con `area_id` del área universidad o `source = 'university'` / `task_type = 'study'`).
  - **Emprendimiento** (origen `entrepreneurship_tasks` + tareas con área de emprendimiento).
  - **Proyectos** (`source = 'projects'` o con `project_id`).
  - **Tareas** (resto / personales).
- Cada pestaña reutiliza el listado actual filtrado, con su contador.

## 3. Arreglar áreas (eliminar "Profesional")

- Las áreas canónicas son las del **Plan Identidad** (tabla `identity_plan` / pilares definidos ahí).
- Auditar dónde aparece "Profesional" hardcodeado (probablemente `src/lib/data.ts`, `definitions.ts`, `MonthlyAreaGoals`, selects de tareas).
- Reemplazar la lista hardcodeada por un hook `useIdentityAreas()` que lea las áreas oficiales del Plan Identidad y las exponga a todos los selectores (Tareas, Sistemas, Goals, etc.).
- Migrar datos: tareas con `area_id` apuntando a "profesional" se reasignan al área equivalente del Plan Identidad (o quedan sin área para que el usuario reasigne).

## 4. Crear tareas desde la página Sistemas

- `FocusTasksPanel.tsx` ya existe pero el botón "+ Nueva tarea" no está persistiendo / no abre diálogo funcional. Lo conectamos:
  - Reutilizar `AddItemDialog` (o un `QuickTaskCreator`) con campos: título, área (del Plan Identidad), tipo (universidad/emprendimiento/proyecto/tarea), fecha = hoy.
  - Inserta en `tasks` con `area_id` correcto y queda visible en la pestaña correspondiente de la página Tareas.
- Añadir también un botón "+" global en el header de la sección Foco de `Systems.tsx`.

## 5. Botón rutina 5 AM en horario del día

- En `PresetSchedulePicker.tsx` (usado en Sistemas y Planificación) añadir un botón rápido "Aplicar rutina 5 AM" que selecciona el preset ya creado (`Rutina 5AM`) y lo guarda en `daily_plans` de hoy.
- Si el preset no existe aún (instalaciones nuevas), seed automático con los bloques que el usuario definió:
  ```text
  05:00–05:30  Rutina de inicio
  05:30–07:00  Foco
  07:00–08:00  Gym
  08:00–08:30  Alistamiento + desayuno
  08:30–09:00  Podcast / lectura
  09:00–13:20  Trabajo (bloques 1:30)
  13:20–14:00  Almuerzo
  14:00–18:30  Trabajo (bloques 1:30)
  18:30–20:00  Idiomas
  20:00–21:30  Trabajo u ocio
  21:30–22:00  Piano
  22:00–22:30  Rutina de desactivación
  ```

## 6. Rachas de Sistemas en base de datos (no localStorage)

- `WeekStreakBar.tsx` ya lee de `daily_systems_tracking`, pero el cálculo de la **racha actual** (🔥 número) sigue derivándose en cliente sin persistir.
- Crear tabla `system_habit_streaks` (`habit_id`, `current_streak`, `longest_streak`, `last_completed_date`, timestamps) y trigger que la actualice cuando cambia `daily_systems_tracking.completions/time_data/count_data` (lógica similar a `update_area_streak`).
- Hook `useSystemHabitStreaks()` que lee de esa tabla en lugar de recomputar/usar localStorage.
- Limpieza: eliminar cualquier `localStorage.setItem` de rachas en `useSystemsTracking`, `LanguageSkillCards`, `HobbyCards`, etc.

## Detalles técnicos

- **Archivos nuevos**: `src/lib/pwa-register.ts`, `src/hooks/useIdentityAreas.ts`, `src/hooks/useSystemHabitStreaks.ts`, `src/components/systems/QuickAddTaskDialog.tsx`.
- **Archivos modificados**: `vite.config.ts`, `index.html`, `public/manifest.webmanifest`, `src/main.tsx`, `src/pages/Tasks.tsx`, `src/pages/Systems.tsx`, `src/components/systems/FocusTasksPanel.tsx`, `src/components/systems/WeekStreakBar.tsx`, `src/components/routine/PresetSchedulePicker.tsx`, `src/lib/data.ts`, `src/lib/definitions.ts`.
- **Migración**: tabla `system_habit_streaks` (con GRANTs + RLS allow-all conforme al modo sin auth) y trigger sobre `daily_systems_tracking`. Seed/actualización del preset `Rutina 5AM` si falta.
- **Sin cambios destructivos**: los datos existentes se conservan; las tareas con área "profesional" se reasignan vía UPDATE seguro.

¿Procedo con esta implementación?
