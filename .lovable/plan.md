# Coach IA — página de asesoría personal

Una nueva página `/coach-ia` con un asistente que conoce tu vida entera, recuerda conversaciones anteriores, busca en internet y puede crear tareas y colocarlas en los bloques de tu día.

## Qué hace el asistente

1. **Lee tu información real** antes de responder: hoy (tareas, bloques, hábitos, rachas), semana, mes, trimestre (objetivos 12 semanas), Destino a Llegar y Mapa de Vida, además de áreas/esfuerzo y revisiones diarias.
2. **Te aconseja y evalúa**: revisión de dirección ("¿voy bien?"), diagnóstico por área, prioridades del día, apoyo emocional (tono de coach/terapeuta, en español), y avisos cuando algo se está descuidando.
3. **Memoria**: guarda las conversaciones (hilos) y además una memoria de largo plazo con hechos y conclusiones sobre ti que reutiliza en cada charla.
4. **Busca en la web** cuando hace falta información externa (ejercicios, técnicas de estudio, precios, noticias) y cita las fuentes.
5. **Actúa**: crea tareas con área, prioridad y fecha, y las asigna a un bloque de tu rutina; también puede crear varias de golpe (plan del día) y marcar tareas hechas. Cada acción se muestra en el chat con confirmación antes de guardar.

## Interfaz

- Página nueva en la barra de navegación: "Coach IA".
- Chat a pantalla completa con respuestas en streaming y markdown, historial de hilos en un panel lateral/desplegable.
- Botones rápidos: "Evalúa mi semana", "¿Qué hago ahora?", "Planifica mi día", "Me siento mal", "Revisa mi dirección".
- Tarjetas de acción dentro del chat: tarea propuesta → selector de bloque + área → "Crear".
- Panel de "Memoria" para ver, editar y borrar lo que el asistente recuerda.

## Lienzo visual

Al lado del chat (abajo en móvil) hay un lienzo donde el asistente dibuja lo que explica, en vez de solo texto:

- **Gráficos de tus datos**: barras/líneas de minutos por área, cumplimiento semanal, progreso de metas y trimestre, rachas, comparativa semana vs semana.
- **Apoyos explicativos**: listas de pasos, comparaciones lado a lado, tabla de prioridades, línea de tiempo del día con los bloques.
- **Resultados de la web**: tarjetas con título, resumen y enlace de cada fuente encontrada.
- El asistente elige el visual según la pregunta (herramienta `mostrar_visual`), y cada mensaje guarda su visual para poder volver a verlo al abrir el hilo.
- Los visuales se renderizan con Recharts y componentes propios, en el mismo estilo minimalista en grises del resto de la app.



## Detalles técnicos

**Base de datos** (nuevas tablas, RLS abierta como el resto del proyecto, con GRANTs):
- `ai_conversations` (id, title, created_at, updated_at)
- `ai_messages` (id, conversation_id, role, content, tool_calls jsonb, created_at)
- `ai_memories` (id, kind, content, importance, source, created_at) — memoria de largo plazo

**Edge Function `life-coach`** (`verify_jwt = false`, como las existentes):
- Lee el contexto directamente de la base con la service role: `tasks`, `routine_blocks`, `daily_systems_tracking`, `daily_area_stats`, `daily_reviews`, `weekly_objectives`/`weekly_plans`, `monthly_area_goals`, `twelve_week_goals`/`sprints`, `point_b_metrics`, `identity_plan`, `goals`, `area_streaks`.
- Modelo `google/gemini-3.7-flash` vía Lovable AI Gateway, con streaming y la conversación completa reenviada en cada turno.
- Herramientas (tool calling): `buscar_web`, `crear_tarea`, `crear_plan_dia`, `asignar_tarea_a_bloque`, `completar_tarea`, `guardar_memoria`, `leer_contexto_extra`.
- Búsqueda web mediante grounding del modelo; si no hay resultados, lo dice en vez de inventar.
- Errores del gateway (402/429/etc.) se muestran tal cual en la UI, sin respuestas falsas.

**Frontend**: `src/pages/CoachIA.tsx` + componentes en `src/components/coach/`, hook `useCoachChat` para streaming SSE y persistencia, ruta en `App.tsx` y entrada en el menú. Las tareas creadas usan el mismo formato que la página Tareas (respetando `area_id` y `routine_block_id`) para que aparezcan en Hoy y en los bloques.
