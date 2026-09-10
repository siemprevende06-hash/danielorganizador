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

async function buildGymContext(sb: any) {
  const [gym20, tracking, sessions] = await Promise.all([
    sb.from("gym20_data").select("*").order("updated_at", { ascending: false }).limit(1),
    sb.from("daily_systems_tracking")
      .select("tracking_date,workout_duration,completions,skipped")
      .order("tracking_date", { ascending: false }).limit(45),
    sb.from("workout_sessions").select("*").order("ended_at", { ascending: false }).limit(10),
  ]);
  const raw = gym20.data && gym20.data[0] ? gym20.data[0].state : null;
  return {
    gym2: summarizeGymState(raw),
    esfuerzo_reciente: (tracking.data || []).map((t: any) => ({
      fecha: t.tracking_date,
      duration: t.workout_duration ? t.workout_duration + " min" : null,
      completado: !!(t.completions && t.completions["entrenamiento-fisico"]),
      descanso: !!(t.skipped && t.skipped["entrenamiento-fisico"]),
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

TU TRABAJO:
1. Prepara el PRÓXIMO entrenamiento concreto: para cada ejercicio indica series, repeticiones y PESO sugerido (kg), basándote en el historial real de arriba, no inventes.
2. Usa progresión sana: si la última vez completó todas las series y reps al peso, sube 2.5 kg (o 5 en sentadilla, peso muerto rumano y prensa). Si no completó, repite el peso. Si lleva 2-3 sesiones iguales sin progresar, baja 10% y sube de nuevo.
3. Recuerda su tope cardíaco: entre ejercicios pesados de piernas sugiere 3-4 min de descanso; en accesorios 2 min.
4. Puede pedirte ajustar la rutina, explicar un ejercicio, organizar descansos o revisar su progreso. Usa siempre los datos reales.
5. Sé honesto: si ves que el peso no progresa o que se está excediendo con series, díselo claro.

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