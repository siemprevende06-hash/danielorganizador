# Plan de mejoras

## 1. Biblioteca — Indicador de tiempo de lectura diario
En `src/pages/ReadingLibrary.tsx` agregar una tarjeta superior con:
- **Tiempo leído hoy** (suma de `language_sessions.reading_duration` del día actual + cualquier sesión de focus marcada como lectura).
- **Meta diaria** calculada desde `dailyPages` y libros pendientes del mes (fórmula ya existe).
- Mini barra semanal con minutos por día (últimos 7 días) usando `WeekStreakBar` con `habitId="lectura"` para reutilizar la racha en BD.
- Badge "Hoy: X min / Y min objetivo" con color verde si cumple.

## 2. Sistemas — Persistencia real de rachas y checks
El trigger en BD ya recalcula `system_habit_streaks`, pero los checklist actualmente se guardan con claves inconsistentes. Asegurar que:
- Cada checkbox de Sistemas (lectura, ajedrez, música, idiomas, **entrenamiento**, hobbies) escribe en `daily_systems_tracking.completions` con clave `streak:<habitId>` y valor `"true" | "min" | "max"`.
- Añadir trigger `AFTER INSERT OR UPDATE OR DELETE ON daily_systems_tracking` que invoque `refresh_system_habit_streaks_for_row` (la función existe pero **no hay trigger**, por eso no se actualizan rachas — verificado en `<db-triggers>`).
- Reset diario a medianoche: `useSystemsTracking` ya hace `useMidnightReset`, confirmar que también limpia visualmente todos los checklist (entrenamiento, lectura, música, ajedrez) — el row del nuevo día queda vacío automáticamente.

**Migración necesaria:**
```sql
CREATE TRIGGER trg_refresh_system_streaks
AFTER INSERT OR UPDATE OR DELETE ON public.daily_systems_tracking
FOR EACH ROW EXECUTE FUNCTION public.refresh_system_habit_streaks_for_row();
```

## 3. Inicio — Datos reales y portadas navegables
Refactor `src/hooks/usePillarProgress.ts` y `src/components/pillars/PillarCard.tsx`:

**a) Datos reales por área** — leer de fuentes correctas:
- **Universidad**: `tasks` con `area_id='universidad'` + `exams` próximos + `university_subjects` (GPA actual).
- **Emprendimiento**: `entrepreneurship_tasks` del día + `entrepreneurship_income` mes.
- **Proyectos**: `tasks` con `area_id='proyectos'` + `projects` activos.
- **Gym**: `exercise_logs` semana + racha desde `area_streaks` (no habit_history).
- **Idiomas**: `language_sessions` día + minutos reales.
- **Esfuerzo del día**: integrar desde Sistemas (`daily_systems_tracking.completions` count) → mostrar % esfuerzo.
- **Resultados**: integrar desde `tasks` (completadas hoy / totales hoy) → mostrar % resultados.
- Mostrar ambos números en la tarjeta de cada pilar (esfuerzo / resultados separados).

**b) Portada por tarjeta**:
- Añadir columna `cover_image_url TEXT` a `identity_plan` (o nueva tabla `pillar_covers` si prefieres no tocarla; recomiendo `pillar_covers(pillar_id TEXT PK, cover_url TEXT)`).
- En `PillarCard`: si hay `cover_url` mostrar como background con overlay; botón hover para subir nueva imagen al bucket `user-images/pillars/`.
- Toda la tarjeta envuelta en `<Link to={ruta}>` → universidad `/university`, emprendimiento `/entrepreneurship`, proyectos `/projects`, gym `/gym`, idiomas `/languages-dashboard`.

**Migración:**
```sql
CREATE TABLE public.pillar_covers (
  pillar_id TEXT PRIMARY KEY,
  cover_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pillar_covers TO anon, authenticated;
GRANT ALL ON public.pillar_covers TO service_role;
ALTER TABLE public.pillar_covers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.pillar_covers FOR ALL USING (true) WITH CHECK (true);
```

## 4. Metas secundarias — Música unificada + Gaming
En `usePillarProgress.ts` `SECONDARY_GOALS_CONFIG`:
- **Eliminar** `piano` y `guitarra` separados.
- **Agregar** `musica` (icono 🎵, ruta `/music-dashboard`) → `completed=true` si **piano OR guitarra** se hizo hoy; `duration` = suma de ambos.
- **Mantener** `lectura`, `ajedrez`.
- **Agregar** `gaming` (icono ❤️ Heart de lucide-react, sin ruta — toggle directo) → guardado en `daily_systems_tracking.completions['streak:gaming']`.

Resultado final: 4 metas secundarias → Música, Lectura, Ajedrez, Gaming.

## Archivos a tocar
- `src/pages/ReadingLibrary.tsx` (tarjeta tiempo diario)
- `src/hooks/usePillarProgress.ts` (datos reales + música unificada + gaming + esfuerzo/resultados)
- `src/components/pillars/PillarCard.tsx` (portada + Link)
- `src/components/pillars/SecondaryGoalsProgress.tsx` (icono Heart para gaming, ruta música)
- `src/components/systems/WeekStreakBar.tsx` (asegurar escritura con clave correcta — ya OK)
- Migración: trigger streaks + tabla `pillar_covers`
