import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MODELOS_FREE = [
  "qwen/qwen3-32b:free",
  "qwen/qwen3-8b:free",
  "moonshotai/kimi-k2-0905:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

let MODELO_ACTIVO: string | null = null;

const todayStr = () => {
  // Hora de Cuba (UTC-4)
  const d = new Date(Date.now() - 4 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
};

const fmt = (n: number | undefined) =>
  (Math.round((n || 0) * 10) / 10).toLocaleString("es-ES");

const calcSleepHours = (wake: string, sleep: string): number => {
  if (!wake || !sleep) return 0;
  const [wh, wm] = wake.split(":").map(Number);
  const [sh, sm] = sleep.split(":").map(Number);
  if (isNaN(wh) || isNaN(wm) || isNaN(sh) || isNaN(sm)) return 0;
  const diff = wh * 60 + wm - (sh * 60 + sm);
  const mins = diff >= 0 ? diff : 24 * 60 + diff;
  return Math.round((mins / 60) * 10) / 10;
};

// ---------------- Contexto del gimnasio ----------------

const DAYN = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

/** Resume el estado de gym2 (rutinas, semana, pesos, historial) para el modelo. */
function summarizeGymState(raw: any) {
  if (!raw || typeof raw !== "object") return null;
  const st = raw;
  const routines = (st.routines || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    prog: r.prog || null,
    ex: (r.ex || []).map((c: any) => ({
      id: c.id,
      sets: c.sets,
      reps: c.reps,
      repsMin: c.repsMin,
      sec: c.sec,
      mode: c.mode,
      bodyweight: c.bodyweight,
      prog: c.prog,
      inc: c.inc,
    })),
  }));
  const week: Record<string, string> = {};
  for (let d = 0; d < 7; d++) {
    const rid = st.week && st.week[d];
    const r = routines.find((x: any) => x.id === rid);
    if (r) week[DAYN[d]] = r.name;
  }
  const weights = Object.entries(st.exWeights || {}).map(([id, v]: [string, any]) => ({
    ejercicio: id,
    peso: v && v.w,
    fecha: v && v.d,
  }));
  const workouts = (st.workouts || [])
    .slice(-12)
    .reverse()
    .map((w: any) => ({
      fecha: w.d,
      nombre: w.name,
      duracion: w.end && w.start ? Math.round((w.end - w.start) / 60000) + " min" : null,
      volumen: st.unit ? fmt(w.vol) + " " + st.unit : null,
      ejercicios: (w.entries || []).map((e: any) => ({
        id: e.id,
        series: (e.sets || [])
          .filter((s: any) => s.done)
          .map((s: any) => (s.sec ? `${s.sec}s` : fmt(s.w) + "x" + (s.r ?? "-"))),
      })),
    }));
  return {
    unidad: st.unit || "kg",
    descanso_seg: st.restSec != null ? st.restSec : 90,
    peso_objetivo: st.targetW ?? null,
    semana: week,
    rutinas: routines,
    pesos_top_por_ejercicio: weights,
    historial_reciente: workouts,
  };
}

const hoy = () => todayStr();
const enNDias = (n: number) => {
  const d = new Date(Date.now() - 4 * 60 * 60 * 1000);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

async function buildGymContext(sb: any) {
  const [gym20, tracking, sessions, comidas, plan] = await Promise.all([
    sb.from("gym20_data").select("*").order("updated_at", { ascending: false }).limit(1),
    sb.from("daily_systems_tracking")
      .select(
        "tracking_date,workout_duration,workout_intensity,completions,skipped,sleep_time,wake_time,water_data"
      )
      .order("tracking_date", { ascending: false }).limit(30),
    sb.from("workout_sessions").select("*").order("ended_at", { ascending: false }).limit(10),
    sb.from("meal_tracking")
      .select("meal_date,meal_type,completed,notes")
      .order("meal_date", { ascending: false }).limit(20),
    sb.from("meal_plan")
      .select("plan_date,meal_slot,recipes(name)")
      .gte("plan_date", hoy())
      .lte("plan_date", enNDias(6)),
  ]);
  const raw = gym20.data && gym20.data[0] ? gym20.data[0].state : null;
  const recetaNombre = (p: any) =>
    Array.isArray(p.recipes)
      ? p.recipes[0] && p.recipes[0].name
      : p.recipes && p.recipes.name;
  return {
    gym2: summarizeGymState(raw),
    esfuerzo_reciente: (tracking.data || []).map((t: any) => ({
      fecha: t.tracking_date,
      duration: t.workout_duration ? t.workout_duration + " min" : null,
      intensidad: t.workout_intensity || "moderate",
      completado: !!(t.completions && t.completions["entrenamiento-fisico"]),
      descanso: !!(t.skipped && t.skipped["entrenamiento-fisico"]),
    })),
    sueño_reciente: (tracking.data || []).slice(0, 14).map((t: any) => ({
      fecha: t.tracking_date,
      horas_sueño: calcSleepHours(t.wake_time, t.sleep_time) || null,
      acostarse: t.sleep_time ? t.sleep_time.slice(0, 5) : null,
      despertar: t.wake_time ? t.wake_time.slice(0, 5) : null,
    })),
    agua_reciente: (tracking.data || []).slice(0, 7).map((t: any) => ({
      fecha: t.tracking_date,
      vasos: t.water_data
        ? Object.values(t.water_data).filter(Boolean).length
        : 0,
    })),
    comidas_recientes: (comidas.data || []).map((m: any) => ({
      fecha: m.meal_date,
      comida: m.meal_type,
      completada: !!m.completed,
    })),
    plan_comidas_proximos_7_dias: (plan.data || []).map((p: any) => ({
      fecha: p.plan_date,
      slot: p.meal_slot,
      receta: recetaNombre(p),
    })),
    sesiones_daily: sessions.data || [],
  };
}

// ---------------- Handler ----------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) return json({ error: "OPENROUTER_API_KEY no está configurada" }, 500);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => null);
    const message = body?.message;
    const history: { role: string; content: string }[] = Array.isArray(body?.history) ? body.history : [];
    if (!message || typeof message !== "string") return json({ error: "Falta el mensaje" }, 400);

    const ctx = await buildGymContext(sb);
    // El cliente puede enviar su estado gym2 actual (más fresco que el que está sincronizado).
    if (body?.gymState && typeof body.gymState === "object") {
      ctx.gym2 = summarizeGymState(body.gymState) || ctx.gym2;
    }

    const systemPrompt = `Eres el ENTRENADOR PERSONAL de IA de Daniel, experto en fuerza e hipertrofia. Hablas SIEMPRE en español, directo y práctico, sin relleno.

Datos de Daniel:
- Hombre de 22 años, 1.75 m, ~50 kg, ectomorfo: le cuesta ganar peso y masa muscular.
- Objetivos: ganar músculo y peso corporal (50 → 53-55 kg en 3 meses, 57-60 en 6 meses, 62-65 en 1 año).
- Condición: prolapso de válvula mitral ASINTOMÁTICO. Su médico autorizó entrenar pero con cuidado: FC de reposo ≈ 120 lpm, picos hasta 130 lpm, tope 148 lpm. NO debe llegar a ese tope. Usa series largas descansando 2-4 min y exhalando en el esfuerzo. Si siente mareo, dolor de pecho o palpitaciones fuertes, para de inmediato.

Su plan semanal (DUP — progresión día a día en Gym 2.0):
${ctx.gym2 ? JSON.stringify(ctx.gym2.semana, null, 2) : "No hay plan aún cargado."}

Su rutina y progresión ya registrada (Gym 2.0):
${ctx.gym2 ? JSON.stringify(ctx.gym2, null, 2).slice(0, 25000) : "Sin datos todavía."}

Esfuerzo de los últimos días (página Esfuerzo):
${JSON.stringify(ctx.esfuerzo_reciente || [], null, 2)}

Sueño de los últimos días (página Sistemas):
${JSON.stringify(ctx.sueño_reciente || [], null, 2)}

Agua (vasos por día, últimos 7 días):
${JSON.stringify(ctx.agua_reciente || [], null, 2)}

Comidas recientes (seguimiento de alimentación):
${JSON.stringify(ctx.comidas_recientes || [], null, 2)}

Plan de comidas de los próximos 7 días:
${JSON.stringify(ctx.plan_comidas_proximos_7_dias || [], null, 2)}

ALCANCE (REGLAS DE ORO):
- Solo respondes sobre GIMNASIO y rendimiento físico: entrenamiento y ejercicios, progresión de fuerza y masa muscular, rutinas, NUTRICIÓN orientada a entrenar (ganar peso, proteínas, comidas, plan de alimentación), SUEÑO, descanso y recuperación.
- Son bienvenidas y útiles las preguntas de nutrición, sueño y descanso; usa los datos de arriba cuando aplique.
- Si te preguntan cualquier cosa FUERA de eso (finanzas, dinero, trabajo, tecnología, relaciones, estudios, política, noticias, etc.), NO des respuesta sobre el tema: contesta en UNA línea que solo puedes ayudar con gimnasio, nutrición, sueño y recuperación, y devuelve el foco a un tema fitness (por ejemplo: "¿cómo va tu próximo entrenamiento?").

TU TRABAJO:
1. Prepara el PRÓXIMO entrenamiento concreto: para cada ejercicio indica series, repeticiones y PESO sugerido (kg), basándote en el historial real de arriba, no inventes.
2. Usa progresión sana: si la última vez completó todas las series y reps al peso, sube 2.5 kg (o 5 en sentadilla, peso muerto rumano y prensa). Si no completó, repite el peso. Si lleva 2-3 sesiones iguales sin progresar, baja 10% y sube de nuevo.
3. Recuerda su tope cardíaco: entre ejercicios pesados de piernas sugiere 3-4 min de descanso; en accesorios 2 min.
4. Puede pedirte ajustar la rutina, explicar un ejercicio, organizar descansos o revisar su progreso. Usa siempre los datos reales.
5. Sé honesto: si ves que el peso no progresa o que se está excediendo con series, díselo claro.
6. También puede pedirte consejo de NUTRICIÓN (qué y cuánto comer para ganar peso, proteínas, ajustar comidas) y de SUEÑO (horas, horarios, calidad) porque son clave para su meta de ganar músculo. Conecta esos consejos con su entrenamiento.

Reglas:
- Nunca inventes pesos ni series: si no hay historial para un ejercicio, sugiere empezar liviano (0 kg peso corporal / barra sola) y anótalo así.
- Contesta en markdown conciso (máx ~200 palabras), terminando con el plan del día y una pregunta breve.
- Si mencionas muchos números, usa listas puntuales.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-16).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    let finalText = "";

    const chat = (modelo: string) =>
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://lovable.dev",
          "X-Title": "Segundo Cerebro — Gym Coach",
        },
        body: JSON.stringify({ model: modelo, messages }),
      });

    let res: Response | null = null;
    if (MODELO_ACTIVO) {
      try { res = await chat(MODELO_ACTIVO); } catch { res = null; }
    }
    if (!res || !res.ok) {
      for (const m of MODELOS_FREE) {
        try { res = await chat(m); } catch { continue; }
        if (res.ok) { MODELO_ACTIVO = m; break; }
        if (res.status === 401 || res.status === 403) break;
      }
      if (!res || !res.ok) {
        try {
          const mr = await fetch("https://openrouter.ai/api/v1/models", {
            headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` },
          });
          if (mr.ok) {
            const lista = await mr.json();
            const free: string[] = (lista.data || [])
              .filter((x: any) => x.pricing && Number(x.pricing.prompt) === 0 && Number(x.pricing.completion) === 0)
              .map((x: any) => x.id)
              .slice(0, 12);
            for (const m of free) {
              try { res = await chat(m); } catch { continue; }
              if (res.ok) { MODELO_ACTIVO = m; break; }
              if (res.status === 401 || res.status === 403) break;
            }
          }
        } catch { /* sin descubrimiento */ }
      }
    }

    if (!res || !res.ok) {
      if (res) {
        const errText = await res.text();
        let msg = errText;
        try { msg = JSON.parse(errText)?.error?.message || JSON.parse(errText)?.message || errText; } catch { /* texto plano */ }
        return json({ error: msg, status: res.status }, res.status);
      }
      return json({ error: "No se pudo conectar con OpenRouter" }, 502);
    }

    const data = await res.json();
    finalText = data.choices?.[0]?.message?.content || "";

    if (!finalText) {
      finalText = "No pude generar una respuesta esta vez. ¿Puedes reformular tu pregunta?";
    }

    return json({ content: finalText, visuals: [], acciones: [], fuentes: [] });
  } catch (e) {
    return json({ error: (e as Error).message || "Error inesperado" }, 500);
  }
});