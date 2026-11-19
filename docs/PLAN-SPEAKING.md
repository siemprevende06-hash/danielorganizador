# Plan: sección Speaking de Idiomas

> Objetivo: que hablar con el tutor sea **fluido, fiable y con memoria**. Hoy la conversación funciona, pero la sesión se rompe en los bordes (micrófono, cronómetro, resumen) y todo lo que aprendes se pierde al recargar.

Referencia de líneas: estado del repo a 18/11/2026. Si cambian, buscar por el texto citado.

---

## 1. Resumen ejecutivo

La base es buena: streaming, feedback en burbuja aparte (no interrumpe el hilo), voz natural, escenarios, estructuras de respuesta, modo manos libres y limpieza de transcripciones del ASR. Lo que falta es **cerrar el bucle**:

1. **Los minutos se registran mal.** El cronómetro del tutor guarda *todo* como `speaking`, aunque estés en Gramática o Chat libre (`LanguageTutorPanel.tsx:289`). Además hay tres formas de sumar minutos que pueden duplicarse.
2. **La sesión no se cierra de verdad.** Al pulsar "Terminar y guardar", el micrófono se reabre solo y el tutor sigue preguntando (`finishSession`, `finishScenario`). Si terminas mientras responde, el resumen se pierde y no hay forma de pedirlo.
3. **Las correcciones no se guardan.** El feedback vive en `useState` (`useLanguageTutorCoach.ts:96`): se pierde al recargar, al cambiar de hilo y al cambiar de idioma. No llega al cuaderno de errores ni a Progreso.
4. **No hay pronunciación.** El reconocedor ya da `confidence` (`useSpeechRecognition.ts:6`) y no se usa. El playbook promete *shadowing* (`playbook.ts:82`) pero no existe ningún ejercicio de repetición.
5. **El prompt del playbook contradice al del sistema.** Uno pide corregir en el chat, el otro lo prohíbe (`playbook.ts:87` vs `language-tutor/index.ts:265`). El comportamiento cambia según por dónde entres.
6. **Cada turno cuesta 2–4 llamadas al modelo** (chat + feedback + estructura + sugerencia). Con proveedores gratuitos eso se traduce en esperas y errores.
7. **La seguridad de los datos del tutor es débil.** Las tablas `ai_*` son legibles y escribibles por cualquiera con la anon key (`20260819232434_...sql:10,25,40`) y la Edge Function usa `service_role` sin validar identidad.

Resultado esperado: abres Idiomas → Hablar → hablas 10 minutos → terminas → ves **minutos, turnos, % de frases correctas y 3 errores guardados en el cuaderno**, y mañana la cola de repaso te los devuelve.

---

## 2. Mapa actual de la sección

| Archivo | Qué hace | Dónde falla |
|---|---|---|
| `src/pages/LanguagesDashboard.tsx` | Puerta de entrada, sesión del día, registro de práctica | `registerPractice` suma minutos a ciegas |
| `src/components/languages/PracticePanel.tsx` | Sub-pestañas Tutor / Temporizador / Vocabulario | Speaking es un chip dentro de Tutor, no una pestaña |
| `src/components/languages/LanguageTutorPanel.tsx` | Corazón de la sección: modos, escenarios, estructuras, micro, cronómetro, historial | 1742 líneas, mucha lógica de sesión mezclada con UI |
| `src/hooks/useLanguageTutor.ts` | Chat con streaming + persistencia de hilos | Race al crear hilo; no restaura feedback |
| `src/hooks/useLanguageTutorCoach.ts` | Feedback, explicación, sugerencia, estructura | Estado efímero; 1 llamada por cada cosa |
| `src/hooks/useSpeechRecognition.ts` | ASR con deduplicación de fragmentos | `confidence` ignorada |
| `src/hooks/useSpeechSynthesis.ts` | TTS por frases, voces Natural, anti-corte de Chrome | Velocidad fija |
| `src/hooks/usePracticeSession.ts` | Cronómetro con pausa | Redondeo, tiempo en segundo plano |
| `src/components/languages/speakingScenarios.ts` | 8 role-plays | Sin nivel ni objetivo medible |
| `src/components/languages/speakingStructures.ts` | 13 estructuras + generador | Sin nivel; `structureFallback` muerta |
| `supabase/functions/language-tutor/index.ts` | Prompts, proveedores, herramientas | Reglas contradictorias; sin auth |

### Lo que ya está bien (no tocar)

- Feedback **fuera** del hilo: la conversación no se corta con correcciones.
- `speakStream` lee mientras llega el texto y `stop()` conserva el punto de lectura.
- `limpiarRepeticiones` + `unirFragmentos` resuelven el bug clásico de Chrome.
- Voz Natural de Edge priorizada y recordada por idioma.
- `forceMount` conserva la conversación al cambiar de pestaña.
- Pings SSE cada 15 s y timeout *por inactividad* del stream.
- Autoscroll que respeta al usuario que está leyendo arriba.

---

## 3. Bugs a arreglar

Prioridad: **P0** rompe datos o confianza · **P1** rompe el bucle de aprendizaje · **P2** molesta.
Esfuerzo: **S** ≤ 2 h · **M** 2 h–1 día · **L** > 1 día.

### P0 — datos y sesión

#### B1. El cronómetro del tutor registra siempre "speaking" · S
- **Dónde:** `LanguageTutorPanel.tsx:288-291` (`usePracticeSession(minutes => onLogPractice('speaking', ...))`); el cronómetro se pinta en todos los modos (`:1049`).
- **Síntoma:** 20 min de Gramática marcan Speaking como practicada y suman minutos de speaking. La racha y el mapa de habilidades mienten.
- **Arreglo:** derivar la habilidad de `activeMode?.statId`; en Chat libre no auto-registrar (preguntar al cerrar: "¿qué practicaste?" con las 6 habilidades) o descartar con aviso.
- **Aceptado cuando:** una sesión de Gramática nunca toca la clave `speaking` en `daily_systems_tracking`.

#### B2. Terminar sesión o escenario no cierra el micrófono · S
- **Dónde:** `finishSession` `:658-670`, `finishScenario` `:606-610`; el rearme vive en `:573-580`; el estado en `:954-976`.
- **Síntoma:** tras el resumen final el micro se reabre y el tutor hace otra pregunta. El escenario "terminado" sigue vivo.
- **Arreglo:** al terminar: `setHandsFree(false)`, `setMicArmed(false)`, `sttAbort()`, `pauseSession()`, y bloquear el envío hasta que el usuario decida seguir.
- **Aceptado cuando:** el resumen es el último turno y el micro queda cerrado.

#### B3. "Terminar y guardar" durante una respuesta pierde el resumen para siempre · S
- **Dónde:** `:659-669`. `finishTimer()` ya puso el reloj a 0 y el botón se deshabilita por `sessionElapsedMs < 1000` (`:1099`).
- **Síntoma:** se guardan los minutos, no llega el resumen y no hay manera de pedirlo.
- **Arreglo:** deshabilitar el botón mientras `loading` con tooltip ("esperando al tutor"), o encolar la petición y lanzarla al terminar. Añadir acción "Pedir resumen" tras cerrar.
- **Aceptado cuando:** cualquier combinación de clics termina con resumen o con un aviso explícito.

#### B4. Sesiones de menos de 30 s desaparecen sin aviso · S
- **Dónde:** `usePracticeSession.ts:56` (`Math.round`) + `LanguagesDashboard.tsx:329` (`if (minutes <= 0) return`).
- **Síntoma:** practicas 40 s, pulsas guardar y no se registra nada; el toast simplemente no aparece.
- **Arreglo:** `Math.max(1, Math.round(...))` si han pasado ≥ 20 s; si se descarta, toast explícito. Guardar también `elapsedMs` para métricas futuras.
- **Aceptado cuando:** una sesión de 40 s cuenta 1 min y una de 5 s dice "descartada".

#### B5. El cronómetro cuenta el tiempo con la pestaña en segundo plano · S
- **Dónde:** `usePracticeSession.ts:34` usa reloj de pared; solo se pausa al salir de la pestaña Practicar (`LanguageTutorPanel.tsx:424-433`).
- **Síntoma:** dejas la pestaña 30 min para hacer la comida y la sesión suma 30 min.
- **Arreglo:** pausar en `document.visibilitychange === 'hidden'` y reanudar al volver (acumulando solo tiempo visible). Aviso en la UI si se pausó solo.
- **Aceptado cuando:** el tiempo con la pestaña oculta no suma.

#### B6. Tres formas de sumar minutos que se pueden duplicar · M
- **Dónde:** Temporizador del dashboard `LanguagesDashboard.tsx:430-444`; cronómetro del tutor `LanguageTutorPanel.tsx:289`; botones "Registrar N min" `:1425-1440`. Todos acaban en `registerPractice`, que **suma** (`:337`).
- **Síntoma:** dos cronómetros a la vez → los mismos minutos entran dos veces en `daily_systems_tracking`.
- **Arreglo:** un solo cronómetro activo (el otro se deshabilita con motivo visible). Los botones manuales, si se quedan, deben fijar un máximo diario en vez de sumar, o marcarse como "estimación".
- **Aceptado cuando:** iniciar un cronómetro bloquea el otro y no hay doble entrada.

#### B7. Manos libres no arma el micrófono; tras un error la UI miente · S
- **Dónde:** `:954-976` cambia `handsFree` pero no `micArmed`; el efecto exige ambos (`:573-580`). En `:276-280`, cualquier error pone `micArmed=false`.
- **Síntoma:** activas "Manos libres", hablas y no pasa nada; el botón dice "on". Si el micro falla una vez, la conversación se queda muda sin explicación.
- **Arreglo:** al activar manos libres en Speaking con STT disponible: `startListening()` + `setMicArmed(true)` y no exigir un segundo toque. En error: toast, apagar el toggle y ofrecer reintentar. Estado "esperando tu turno" visible.
- **Aceptado cuando:** un toque activa el ciclo completo y el estado del botón coincide con la realidad.

#### B8. El feedback y la revisión de estructura no se guardan · L
- **Dónde:** `useLanguageTutorCoach.ts:96` (estado en memoria); `openConversation` (`useLanguageTutor.ts:158-180`) no los recupera.
- **Síntoma:** recargas la página o abres el hilo de ayer y todas las correcciones desaparecieron aunque los mensajes estén en `ai_messages`.
- **Arreglo:** persistir `{ feedback, structureReview }` en el JSONB `visual` del mensaje del usuario (o una columna `metadata`), hacer `update` cuando llega la evaluación y rehidratar en `openConversation`.
- **Aceptado cuando:** las correcciones de ayer se ven al reabrir el hilo.

#### B9. Race al empezar un hilo nuevo mientras llega la primera respuesta · S
- **Dónde:** `useLanguageTutor.ts:327` (`setConversationId(data.id)` cuando resuelve el insert); `newConversation` `:182-193`.
- **Síntoma:** pulsas "Nuevo hilo" justo después de enviar y el panel vuelve a quedar atado a la conversación vieja.
- **Arreglo:** token de petición o comparar `convRef.current === convId` antes de asignar; ignorar resoluciones tardías.
- **Aceptado cuando:** el hilo nuevo se mantiene vacío aunque el insert anterior llegue después.

#### B10. Abrir o borrar un hilo no detiene el cronómetro · S
- **Dónde:** `openThread` `:726-736`, `handleDeleteConversation` `:738-749`.
- **Síntoma:** leyendo conversaciones viejas los minutos siguen corriendo y se guardan como práctica.
- **Arreglo:** cerrar la sesión (`finishTimer` + log) o pausarla antes de cambiar de hilo; definir semántica y mostrarlo en el toast.
- **Aceptado cuando:** navegar por el historial no añade minutos.

### P1 — el bucle de aprendizaje

#### B11. El prompt del playbook contradice al del sistema · S
- **Dónde:** `playbook.ts:86-87` ("Corrige solo lo importante al final de cada turno…") frente a `language-tutor/index.ts:265` ("NO corrijas sus errores en el chat").
- **Síntoma:** depende del botón por el que entres, el tutor corrige dentro de la conversación o no. Rompe la inmersión y duplica el feedback.
- **Arreglo:** reescribir el prompt de `speaking` para que delegue la corrección al sistema de feedback; si el usuario pide explícitamente "corrígeme", permitir una nota breve en español **después** del turno, no dentro.
- **Aceptado cuando:** los cuatro accesos (hero, rail, SkillMap, estructura/escenario) se comportan igual.

#### B12. Escuchar un mensaje apaga la voz automática para toda la sesión · S
- **Dónde:** `toggleSpeak` `:519-526` (`setAutoSpeak(false)`).
- **Síntoma:** pulsas el altavoz de una frase y el tutor deja de leer el resto.
- **Arreglo:** no tocar el ajuste global; "leer este mensaje" es una acción puntual.
- **Aceptado cuando:** el toggle "Voz on/off" solo cambia desde su botón.

#### B13. Los chips de la estructura dependen de etiquetas exactas · S
- **Dónde:** `:1278` compara `item.label` del LLM con `step.label` local.
- **Síntoma:** si el modelo parafrasea una etiqueta, el paso queda neutro aunque la revisión diga que está bien.
- **Arreglo:** emparejar por índice (mismo orden garantizado por el prompt) con fallback por etiqueta, o enviar un `id` numérico y pedir que lo devuelva.
- **Aceptado cuando:** los chips reflejan la revisión incluso con etiquetas renombradas.

#### B14. El feedback no sabe que el texto viene de dictado · S
- **Dónde:** `promptFeedback` `language-tutor/index.ts:1191-1218`.
- **Síntoma:** frases correctas marcadas como incorrectas por "falta puntuación" o mayúsculas; o correcciones que reescriben toda la frase por una palabra mal oída.
- **Arreglo:** añadir al prompt: "El texto viene de reconocimiento de voz: ignora puntuación, mayúsculas y muletillas; evalúa gramática, orden y elección de palabras. Si una palabra parece un error de transcripción, no la penalices".
- **Aceptado cuando:** una frase correcta dicha en voz alta nunca sale "incorrecto" por formato.

#### B15. El resumen final no llega al cuaderno de errores ni al repaso · M
- **Dónde:** `SESSION_END_MSG` (`speakingScenarios.ts:103`) solo pinta markdown en el chat; `addError` solo se llama desde `SessionCloseSheet` (`LanguagesDashboard.tsx:502-507`).
- **Síntoma:** el tutor te da 3 errores con corrección y al día siguiente no están en la cola de repaso.
- **Arreglo:** pedir el cierre en JSON estructurado (o parsear el markdown) y ofrecer "Guardar los 3 errores en el cuaderno" con un clic. Idem para cada corrección individual.
- **Aceptado cuando:** un error guardado desde el speaking aparece en `ReviewQueueCard` y en Progreso.

#### B16. El feedback se puede duplicar o quedar obsoleto · M
- **Arreglo:** cancelar evaluación/estructura al cambiar de hilo, cerrar el panel o cambiar de idioma (hoy solo se resetea el estado, la petición sigue viva y puede repintar). Cachear por hash del texto para no reevaluar la misma frase.

### P2 — detalles

| ID | Bug | Dónde | Arreglo |
|---|---|---|---|
| B17 | `structureFallback` es código muerto y su `id` usa `Date.now()` | `speakingStructures.ts:804-857` | Borrar o usar de verdad con id estable |
| B18 | Confirmación de borrado inexistente en historial | `LanguageTutorPanel.tsx:1214` | `AlertDialog` + undo |
| B19 | Chat sin `aria-live`: el lector de pantalla no anuncia respuestas | `:1299-1303` | `role="log" aria-live="polite"` |
| B20 | Fullscreen sin trampa de foco | `TutorVoiceFullscreen.tsx:175-191` | Trap de Tab, `aria-hidden` al fondo |
| B21 | Autofocus del textarea abre el teclado en móvil tras cada respuesta | `:383-385` | Solo si `matchMedia('(pointer:fine)')` |
| B22 | Botones del micro de 36 px | `:1541-1586` | 44 px en móvil |
| B23 | Los mensajes `hidden` no se guardan: al reabrir un escenario el tutor parece hablar solo | `useLanguageTutor.ts:304-306` | Guardar con `hidden: true` en la fila |
| B24 | Sin búsqueda, renombrado ni fijado en historial (50 hilos) | `:1188-1224` | Buscador + acciones |

---

## 4. Mejoras de aprendizaje

### M1. Modo pronunciación y shadowing (la pieza que falta) · L
El reconocedor ya expone `confidence` por alternativa (`useSpeechRecognition.ts:4-7`) y el proyecto ya normaliza texto (`normalizar`). Se puede puntuar sin gastar ni una llamada al modelo:

1. **Escuchar → repetir → comparar.** Frase objetivo (del escenario o de una lista curada), el usuario la repite, se compara palabra a palabra con Levenshtein sobre `normalizar()`.
2. **Resultado:** % de palabras acertadas, palabras falladas resaltadas y `confidence` medio. Botón "repetir" y "más despacio".
3. **Sin LLM.** El modelo solo entra si el usuario pide una explicación del sonido.
4. **Contenido inicial:** 5 frases por nivel (A2, B1, B2) y 10 pares mínimos italianos (`gli`, dobles consonantes, `é`/`è`).

Esto convierte la promesa del playbook (`shadowing → roleplay → corrección`) en algo real y da una métrica honesta de pronunciación.

### M2. Informe de sesión y métricas de speaking · M
Calcular en local desde la transcripción, sin coste:
- turnos, palabras dichas, **palabras por minuto**, duración media de frase;
- **% de frases correctas** (feedback), errores por categoría;
- muletillas detectadas (`um`, `uh`, `like`, `cioè`…) como texto, sin juicio.

Guardar un registro por sesión (`language_speaking_sessions` o columnas nuevas en `language_sessions`) y pintarlo en `LanguageProgressPanel` con la tarjeta de Speaking. Hoy el playbook promete "errores por turno" y no existe.

### M3. Cuaderno de errores conectado · M
Cada corrección con botón **"Guardar en el cuaderno"** → `addError({ wrong, correct, note: explanation, category })`. Mapear la explicación a `STUDY_ERROR_CATEGORIES` (`languageStudyPlan.ts:50`). Si el mismo error aparece 2 veces en la sesión, ofrecerlo automáticamente al cerrar. Efecto: la cola de repaso de mañana empieza por tus errores reales de speaking.

### M4. Estructuras y escenarios con nivel · M
- Añadir `level: 'A2' | 'B1' | 'B2'` a `SPEAKING_STRUCTURES` y `SPEAKING_SCENARIOS`.
- Ordenar por cercanía al CEFR del usuario y marcar "Para tu nivel".
- Persistir las estructuras generadas (hoy `customStructures` es estado en memoria y se borra al cambiar de idioma: `:177`, `:401`).
- Repaso espaciado: una estructura con pasos fallados vuelve a la cola.

### M5. Escenarios con final medible · S
Hoy un escenario no termina nunca. Añadir objetivo: "3 preguntas", "resolver el problema", "5 minutos". Al cumplirse, el panel ofrece el resumen en vez de encadenar otra pregunta. Convierte el role-play en una tarea con principio y fin.

### M6. Repetición correctiva · M
Tras una corrección: **"Repetir mi frase corregida"** → graba, compara con la versión corregida y da el % de coincidencia. Es lo que separa *probar* de *aprender*; reutiliza M1.

### M7. Dificultad adaptativa · S
Si el % de frases correctas de la sesión > 90 % y el objetivo se cumplió, ofrecer subir el nivel del escenario o `longTalk`. Si < 50 %, ofrecer "turnos cortos" y una estructura.

### M8. Voz ajustable · S
Deslizador de velocidad 0,7–1,1 (hoy fija en `rate = 1`, `:241`), botón "repetir más despacio" en cada mensaje y "leer solo la corrección". Para B1 es la mejora más barata de todas.

---

## 5. Mejoras de experiencia (UI/UX)

### U1. Speaking con pestaña propia · M
Hoy es un chip entre seis modos dentro de `Practicar` (`LanguageTutorPanel.tsx:883-898`) y las simulaciones solo aparecen si aciertas con el chip. Propuesta: cuatro pestañas en `PracticePanel` — **Speaking · Tutor · Temporizador · Vocabulario** — y que el botón `Hablar` del hero aterrice directamente en Speaking con escenarios y estructuras visibles.

### U2. Menos ruido en la barra de herramientas · M
Entre chips de modo, feedback, ayuda, charla larga, estructuras, voz, manos libres y auto-voz hay 12+ controles en tres filas. Agrupar: **Modo** (chips) · **Micrófono** (manos libres + auto-envío) · **⋯ Ajustes** (voz, velocidad, feedback, sugerencias, charla larga). Dejar visibles solo lo que se usa por turno.

### U3. Arranque guiado la primera vez · M
Checklist de 3 pasos con estado en localStorage: 1) permiso de micrófono (probar 2 s), 2) comprobar voz del idioma (hoy los avisos están en un párrafo de 11 px, `:1021-1030`), 3) decir una frase de prueba. Evita el 80 % de los "no funciona el micro".

### U4. Estado de grabación visible · M
Badge **REC** con tiempo, medidor de nivel de entrada (Web Audio `AnalyserNode`, sin coste), "procesando…" y "no te he oído" cuando la captura queda vacía. Hoy solo hay un puntito rojo y `truncate` de una línea.

### U5. Transcripción en vivo legible · S
Dos líneas con las últimas palabras resaltadas y botón **Cancelar**. Ahora se corta a una línea (`:1485-1490`).

### U6. Corregir la transcripción · S
Cada turno del usuario con acciones **Editar** (el ASR se equivoca) y **Repetir**. Si editas, se reevalúa el feedback. Sin esto, un error de dictado se convierte en una corrección falsa.

### U7. Cierre de sesión como pantalla, no como toast · M
`SessionCloseSheet` en modo speaking: minutos, turnos, % correctas, 3 errores con "guardar en cuaderno", frase para reutilizar y "repetir mañana". Un solo sitio donde cerrar el bucle.

### U8. Historial útil · M
Buscador, renombrar, fijar, filtrar por modo/escenario, badge de resumen y borrado con undo.

### U9. Móvil · M
Chat con `dvh` en vez de `62vh`, composer pegado abajo con `safe-area`, sin autofocus, y objetivos táctiles ≥ 44 px.

### U10. Atajos de escritorio · S
Mantener **Espacio** = pulsar y hablar, **Esc** = cortar voz, **Ctrl/Cmd+Enter** = enviar.

### U11. Estado vacío con dirección · S
Hoy: 2 tarjetas + 3 frases sueltas. Propuesta: "Escenario de hoy" (recomendado por nivel), "Estructura recomendada" (la que fallaste) y "Conversación libre".

### U12. Toast con enlace · S
Al guardar minutos: "12 min de Speaking guardados · Ver progreso" con acción que lleva a la pestaña Progreso.

---

## 6. Mejoras técnicas

### T1. Seguridad de las tablas del tutor · M
`ai_conversations`, `ai_messages` y `ai_memories` tienen RLS `USING (true)` y `GRANT` a `anon` (`20260819232434_...sql:7-10,22-25,37-40`). La Edge Function usa `service_role` y no valida quién llama (`language-tutor/index.ts:1277-1281`). Con la anon key (va en el bundle) cualquiera puede leer el historial completo y quemar la cuota de los proveedores.

- Añadir `user_id` a las tres tablas y filtrar por `auth.uid()`.
- La función debe validar el `Authorization` del usuario y pasarlo al cliente (o comprobar el JWT y usar `user_id`).
- Rate limit por usuario en `language-tutor` (p. ej. 30 peticiones/min).
- No es bloqueante si la app es de un solo usuario, pero sí si se comparte el enlace.

### T2. Menos llamadas por turno · M
Hoy, con Speaking por defecto: chat + feedback = 2; con estructura = 3; con sugerencias = 4. `callCoach` tiene 45 s de timeout y sin reintento (`useLanguageTutorCoach.ts:8,56-88`).

- **Unificar** feedback y revisión de estructura en una sola acción (`action: 'feedback'` + `structure`), o devolver ambos en el mismo JSON.
- Cola con prioridad: el chat primero; feedback después; cancelar lo obsoleto al cambiar de turno.
- Reintento con backoff solo en el chat (es el que el usuario espera).
- Cache por hash de `(texto + nivel + idioma)` para feedback.

### T3. Estado de sesión fuera del componente · M
`LanguageTutorPanel` tiene 1742 líneas y 20 `useState`. Extraer `useSpeakingSession` (modo, escenario, estructura, cronómetro, micrófono, objetivo) para que el panel sea presentacional. Reduce el riesgo de los bugs B2/B3/B7, que son todos de estado cruzado.

### T4. Persistencia y esquema · M
- `ai_messages.metadata JSONB` (o reutilizar `visual`) para `{ feedback, structureReview }`.
- `language_speaking_sessions`: `id, date, language, minutes, turns, words, wpm, correct_pct, scenario_id, structure_id, summary`.
- Índice `(scope, updated_at DESC)` ya existe; añadir `ai_messages(conversation_id, role)` si se consultan por rol.

### T5. Tests · M
Hoy no hay ninguno en Idiomas. Añadir:
- `limpiarRepeticiones`, `unirFragmentos`, `dividirEnFrases`, `stripForSpeech` (puros, baratos).
- `usePracticeSession`: redondeo, pausa, visibilidad.
- Flujo "terminar sesión": guarda minutos, pide resumen, cierra micro (test de integración con mocks).

### T6. Observabilidad · S
Log de latencia por acción (`chat`, `feedback`, `structure`, `suggest`) y tasa de error por proveedor. Hoy solo hay `console.warn` disperso en la función.

---

## 7. Roadmap por fases

| Fase | Objetivo | Items | Resultado visible | Esfuerzo |
|---|---|---|---|---|
| **0. Red de seguridad** | Poder tocar sin miedo | T5, build+lint verdes | Tests de los helpers y del cronómetro | S |
| **1. Datos fiables** | Que los minutos digan la verdad | B1, B4, B5, B6, B10 | Una sesión de Gramática ya no cuenta como Speaking | M |
| **2. Cerrar la sesión** | Que terminar sea terminar | B2, B3, B7, B9, B12, B11, B13 | El micro se cierra, el resumen llega siempre | M |
| **3. Memoria del aprendizaje** | Que lo de ayer sirva hoy | B8, B15, M3, M4, M5 | Correcciones persistentes + errores en la cola | L |
| **4. Pronunciación** | La habilidad que falta | M1, M6, M8 | Escuchar → repetir → % de acierto | L |
| **5. Métricas y pulido** | Ver el progreso real | M2, M7, U1–U12, B17–B24 | Tarjeta de Speaking en Progreso y UI limpia | L |
| **6. Escala y seguridad** | Coste y exposición | T1, T2, T3, T6 | 2 llamadas por turno y datos protegidos | M |

**Orden recomendado:** 0 → 1 → 2 → 3 → 4 → 5 → 6. Las fases 1 y 2 son las que más confianza devuelven por hora invertida; la 4 es la que más cambia el aprendizaje.

### Definition of done (por item)

- [ ] Reproducción del bug documentada en el PR (antes/después).
- [ ] Criterio de aceptación del bug cumplido.
- [ ] Sin `any` nuevos ni `eslint-disable` nuevos.
- [ ] Probado en Chrome y Edge; móvil al menos en el layout.
- [ ] Si toca datos: migración en `supabase/migrations` con rollback mental claro.

---

## 8. Métricas de éxito

| Métrica | Hoy | Objetivo |
|---|---|---|
| Minutos de speaking contados correctamente | Se mezclan con otras habilidades | 100 % atribuidos a la habilidad real |
| Sesiones que terminan con resumen | Solo si el tutor no está respondiendo | 100 % |
| Correcciones recuperables al reabrir el hilo | 0 % | 100 % |
| Errores de speaking en la cola de repaso | 0 | ≥ 3 por sesión |
| Llamadas al modelo por turno (por defecto) | 2–4 | 2 |
| Latencia de la primera palabra | Variable | Sin regresión (medir antes) |
| Abandono en el primer minuto | Sin medir | Medir y bajar |

---

## 9. Decisiones pendientes

1. **Tiempo en segundo plano:** ¿cuenta o se pausa? (recomiendo pausar; si no, las estadísticas se inflan).
2. **Chat libre:** ¿registra minutos? ¿Con qué habilidad? (recomiendo no registrar automáticamente y preguntar al cerrar).
3. **Feedback persistente:** ¿por mensaje (más datos, permite repaso fino) o solo el resumen de sesión? (recomiendo por mensaje).
4. **Pronunciación:** ¿frases curadas por nivel o generadas por el tutor? (recomiendo curadas al principio: son evaluables sin LLM y consistentes).
5. **Dos temporizadores:** ¿se unifican en uno o se queda el del tutor como único? (recomiendo uno).
6. **Historial:** ¿se mantiene compartido entre habilidades o se separa por modo? (hoy es por idioma).

---

## 10. Anexo: cómo se ve una sesión ideal

```
┌────────────────────────────────────────────────────────────┐
│ Speaking · B1.2           ⏱ 07:32 / 10 min    ● REC        │
│ Escenario: Entrevista de trabajo · 2/3 preguntas           │
├────────────────────────────────────────────────────────────┤
│  Tutor: So, tell me about a challenge you overcame.        │
│                                            🔊 ↺ (0.8×)     │
│                                                            │
│                              "I worked in a project where…"│
│                              ✅ Correcto · 1 mejora        │
│                              ✏️ Editar   🔁 Repetir         │
│                              📓 Guardar en el cuaderno      │
├────────────────────────────────────────────────────────────┤
│  Estructura: 1 Situación ✅  2 Tarea ✗  3 Acción ✅         │
├────────────────────────────────────────────────────────────┤
│  [ 🎙 Mantén pulsado ]    63 palabras · 92 % correctas      │
└────────────────────────────────────────────────────────────┘
        Al terminar → informe con 3 errores guardados
```

---

## 11. Estado de implementación (18/11/2026)

Todo el plan está implementado salvo lo que se indica abajo. `npx tsc -p tsconfig.app.json --noEmit`
pasa limpio y los tests nuevos pasan (`npm test`).

### Qué se hizo

| Bloque | Estado | Dónde |
|---|---|---|
| B1–B24 | ✅ | `LanguageTutorPanel`, `useLanguageTutor`, `useLanguageTutorCoach`, `usePracticeSession`, `useSpeechRecognition`, `speakingScenarios`, `TutorVoiceFullscreen` |
| M1, M6, M8 | ✅ | `PronunciationTrainer.tsx`, `speakingContent.ts`, `speakingMetrics.ts`, `useSpeechSynthesis` (rate) |
| M2 | ✅ | `useSpeakingSessions.ts` + tarjeta «Speaking: cómo hablas» en `LanguageProgressPanel` |
| M3, B15 | ✅ | `TutorFeedbackBubble` («Guardar en el cuaderno») + informe con `parseSummaryErrors` |
| M4, M5, M7 | ✅ | `level`/`targetTurns`/`targetMinutes` en estructuras y escenarios; SRS de estructuras; recomendación en el informe |
| U1–U12 | ✅ | `PracticePanel` (4 pestañas), onboarding, REC + nivel de micro, edición de transcripción, informe, historial con búsqueda/fijado/undo, atajos, `dvh` y 44 px |
| T1, T4 | ✅ | `supabase/functions/language-tutor` (rate limit 30/min + `Authorization` obligatorio) y migración `20261118000000_language_tutor_user_scope.sql` |
| T2 | ✅ | Feedback + estructura en una sola llamada, con caché por hash |
| T5 | ✅ | `src/lib/__tests__/speakingMetrics.test.ts`, `src/hooks/__tests__/usePracticeSession.test.tsx` |
| T6 | ✅ | `console.debug('[language-tutor] feedback … ms')` |
| T3 | ⏭️ | No se extrajo `useSpeakingSession`: se priorizó el comportamiento sobre la arquitectura, como se acordó |

### Decisiones tomadas

1. **Tiempo en segundo plano:** se pausa. Al volver se reanuda solo si la pausa la provocó el navegador.
2. **Chat libre:** no registra minutos automáticamente. El informe pregunta qué habilidad se practicó.
3. **Feedback persistente:** por mensaje, en `ai_messages.visual` (`{ feedback, structureReview }`).
4. **Pronunciación:** frases curadas por nivel + pares mínimos italianos; puntuación local con Levenshtein.
5. **Dos temporizadores:** queda uno activo a la vez; el otro se deshabilita con motivo visible.
6. **Historial:** compartido por idioma (como antes), con búsqueda, fijado y renombrado.

### Pendiente / notas

- **T3** (extraer `useSpeakingSession`) queda como deuda técnica consciente.
- La migración de `user_id` es conservadora: las filas sin dueño siguen visibles para no romper
  el historial previo ni el modo sin sesión. Cuando se confirme que la app siempre corre
  autenticada, se pueden quitar las ramas `IS NULL` de las políticas.
- `npm test` tiene dos archivos heredados que ya fallaban antes de este plan
  (`DireccionSection.test.tsx` por un texto duplicado y `MejoraRepro.test.tsx` por el mock de
  Supabase). No se tocaron porque no pertenecen a Idiomas.

### Desplegado en Supabase (18/11/2026)

Proyecto `fuqmrtenzlslkeqgdjwy`:

- **Migración aplicada** con el SQL de `20261118000000_language_tutor_user_scope.sql` y registrada
  en `supabase_migrations.schema_migrations`, así que `supabase db push` no la repetirá.
  Verificado: `user_id UUID DEFAULT auth.uid()` en las tres tablas, los 4 índices creados,
  RLS activo y políticas `Owner or legacy on …` sustituyendo a `Allow all …`.
- **Edge Function `language-tutor` desplegada** (versión 20, `verify_jwt = false`). Prueba de humo:
  sin cabecera `Authorization` responde `401`, con cabecera y sin mensaje responde `400`.

**Aviso importante:** `auth.users` está vacío (0 usuarios). Por eso:

1. El backfill del propietario no asignó nada: las 167 conversaciones, 654 mensajes y 36 recuerdos
   existentes siguen con `user_id = NULL` y visibles vía la rama heredada de la política.
2. Mientras no haya sesión, `auth.uid()` es `NULL` y las filas nuevas también nacen sin dueño,
   así que el aislamiento real por usuario **aún no está activo**. Se activará solo cuando la app
   corra con un usuario autenticado; en ese momento conviene hacer un backfill manual del historial
   y, después, endurecer las políticas quitando las ramas `IS NULL`.
