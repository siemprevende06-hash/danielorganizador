## Objetivo

Auditar todo el uso de `localStorage` en la app y migrar al backend (Lovable Cloud) lo que representa **datos de usuario** (hábitos, finanzas, rachas, planes, selecciones, contenido editable). Mantener en `localStorage` solo lo que es **preferencia efímera del dispositivo** (tema, sidebar colapsado, caches de red).

## Inventario y clasificación

### A) MIGRAR AL BACKEND (datos que se pierden entre dispositivos / días)

| # | Fuente | Clave/Archivo | Destino propuesto |
|---|---|---|---|
| 1 | `useFinance.ts`, `pages/Finance.tsx` | `wallets`, `transactions`, `loans`, `debts`, `distributionBags`, `exchangeRate` | Tablas ya existentes: `wallets`, `transactions`, `loans`, `distribution_bags`. Nueva fila en `app_settings` para `exchangeRate`. Eliminar lectura/escritura local. |
| 2 | `useRecompensas.ts` | `rewardsBalance`, `punishmentsBalance`, `canjes`, `lastEarned`, `catalogo` | Nueva tabla `rewards_state` (balance) + `rewards_redemptions` (canjes) + `app_settings` para catálogo. |
| 3 | `HabitTrackerMain.tsx` | `rewardsBalance`, `punishmentsBalance` | Reutilizar `rewards_state`. |
| 4 | `useHabitHistory.ts` | `habitHistory` | Ya existe `habit_history`; eliminar fallback local. |
| 5 | `useJournalEntries.ts` | `journalEntries` | Ya existe `journal_entries`; eliminar fallback local. |
| 6 | `useReminders.ts` | `reminders` | Ya existe `reminders`; eliminar fallback. |
| 7 | `usePerformanceModes.ts` | `performanceModes`, `selectedMode`, `activeRoutine` | Nueva tabla `performance_modes` + fila en `user_settings` para modo seleccionado. |
| 8 | `useRoutineConfig.ts` | `routineConfig`, `musicInstrument` | Guardar en `user_settings` (JSON). |
| 9 | `useRoutineBlocks.ts` | `routineType`, `dailyRoutineBlocks_*` | Ya existen `routine_blocks` / `routine_completions`; consolidar. |
| 10 | `useRoutineCompletions.ts` | fallback local | Eliminar fallback. |
| 11 | `pages/DailyRoutine.tsx` | `routineStreak`, `dailyPlan_*`, `dailyRoutineBlocks_*` | Reusar `daily_plans`, `daily_plan_tasks`, `routine_completions`. |
| 12 | `AssignTaskToBlockDialog.tsx`, `RoutineBlockSchedule.tsx` | `dailyPlanTasks_${date}` | Tabla `daily_plan_tasks` ya existe; migrar. |
| 13 | `pages/Projects.tsx`, `FocusIndicatorsSection`, `QuickStatsGrid` | `userProjects`, `selectedProjectId` | Tabla `projects` ya existe; añadir columna/tabla para "activo" o usar `app_settings`. |
| 14 | `useActiveSelection.ts` | claves `active_*` | Guardar en `app_settings` (setting_key = `active_selection:<scope>`). |
| 15 | `pages/Habits.tsx`, `MiniHabitsSection.tsx` | `miniHabits` (definiciones) | Nueva tabla `mini_habits` o fila en `app_settings`. |
| 16 | `pages/HabilidadesValiosas.tsx` | skills | Nueva tabla `valuable_skills`. |
| 17 | `pages/Motivos.tsx`, `pages/Realidad.tsx`, `pages/Tools.tsx`, `VisionGoalsBoard.tsx` | `motivos`, `realidad`, `idealPartnerVision`, `visionGoals` | Usar `vision_boards` / `vision_board_cells` o crear tabla `text_sections` genérica (`section_key`, `content jsonb`). |
| 18 | `useWeeklyData.ts` | plan semanal | Ya existe `weekly_plans`; migrar. |
| 19 | `useVisionBoard.ts` | cache local | Eliminar fallback (ya usa `vision_boards`). |
| 20 | `lib/pages.ts`, `Navigation.tsx` | `pages_meta`, `page_content_*` | Ya existen tablas para páginas; usarlas. |
| 21 | `pages/ControlRoom.tsx` | agrega varias claves locales | Recalcular leyendo del backend. |
| 22 | `useOverallSystemStreak.ts` | limpieza legacy | Ya migrado; borrar el `removeItem`. |
| 23 | `pages/Focus.tsx` | `TASKS_CACHE_KEY` | Ya viene de DB; degradar a cache opcional o eliminar. |

### B) MANTENER EN LOCALSTORAGE (preferencias del dispositivo)

- `useAutoTheme.ts` → `theme` (light/dark/auto).
- `SidebarContext.tsx` → `sidebarCollapsed`.
- `integrations/supabase/client.ts` → sesión de Supabase (obligatorio).
- `lib/offlineCache` / `offlineQueue` (idb) → cache offline, correcto.

## Enfoque de implementación (por fases)

Se hará por fases pequeñas y verificables. Cada fase = 1 migración + refactor de hooks/páginas afectadas + limpieza del `localStorage` correspondiente.

```text
Fase 1  Finanzas         (#1)          — alto impacto, tablas ya existen
Fase 2  Rachas/Historial (#4 #5 #6 #22)— quitar fallbacks, ya hay tablas
Fase 3  Rutinas y planes (#8 #9 #10 #11 #12) — consolidar en tablas existentes
Fase 4  Recompensas      (#2 #3)       — nuevas tablas
Fase 5  Selecciones/Proyectos (#13 #14) — app_settings o columna is_active
Fase 6  Modos y config   (#7)          — nueva tabla performance_modes
Fase 7  Contenido texto  (#15 #16 #17 #20) — tabla genérica text_sections
Fase 8  Cleanup          (#18 #19 #21 #23) — eliminar fallbacks legacy
```

## Detalles técnicos

- **Nuevas tablas** (mínimas): `performance_modes`, `rewards_state`, `rewards_redemptions`, `valuable_skills`, `text_sections`, `mini_habits`. Todas con `id uuid`, `user_id uuid null` (proyecto sin auth), `created_at`, `updated_at`, trigger `update_updated_at_column`, RLS `USING (true)`, GRANTs a `anon`, `authenticated`, `service_role` (política del proyecto: sin Auth).
- **Reutilizar** `app_settings` (ya existente) para valores escalares (`exchangeRate`, catálogo de recompensas, `active_selection:*`, `selectedPerformanceMode`, `musicInstrument`, `routineType`).
- **Patrón de refactor**: cada hook pasa a `select` inicial + suscripción, y `upsert` en las mutaciones (con `cachedMutation` para offline). Se elimina `localStorage.get/set` de datos, pero se mantiene el cache IndexedDB existente.
- **Migración de datos existentes**: al montar cada hook migrado, si detecta la clave local, la sube al backend una vez y hace `removeItem`.
- **Verificación**: por cada fase, build + smoke test en preview (recarga en otro navegador debería mostrar los mismos datos).

## Fuera de alcance

- Autenticación real (el proyecto sigue sin Auth según memory).
- Rediseño de las tablas ya existentes.
- Cambios de UI o lógica de negocio.

## Entregables

- Un plan de commits por fase (ver arriba).
- Migraciones SQL para las nuevas tablas y grants.
- Refactor de hooks/páginas listados.
- Eliminación de las claves `localStorage` correspondientes, dejando solo tema, sidebar y sesión.
