import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskInfo {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  goalTitle?: string;
  goalProgress?: number;
  areaId?: string;
}

interface BlockInfo {
  title: string;
  startTime: string;
  endTime: string;
  remainingMinutes: number;
}

interface PillarProgress {
  name: string;
  percentage: number;
  tasksCompleted: number;
  tasksTotal: number;
}

interface DayContext {
  currentTime: string;
  currentBlock: BlockInfo | null;
  tasks: TaskInfo[];
  completedTasksCount: number;
  totalTasksCount: number;
  goals: { title: string; progress: number; category: string }[];
  blocksCompleted: number;
  blocksTotal: number;
  nextBlock?: { title: string; startTime: string };
  weekNumber: number;
  daysRemainingInQuarter: number;
  pillarProgress?: PillarProgress[];
  nutritionStatus?: { calories: number; target: number; protein: number };
  focusMinutesToday?: number;
  streaks?: { gym: number; habits: number };
  moodIndicators?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, dayContext } = await req.json() as { message: string; dayContext: DayContext };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build comprehensive context about the day
    const currentHour = parseInt(dayContext.currentTime.split(':')[0]);
    const energyLevel = currentHour < 10 ? "alta (mañana temprano)" : 
                        currentHour < 14 ? "media-alta (mañana productiva)" : 
                        currentHour < 17 ? "media (tarde)" : 
                        currentHour < 20 ? "media-baja (atardecer)" : "baja (noche)";
    
    const pendingTasks = dayContext.tasks.filter(t => !t.completed);
    const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');
    
    const tasksList = pendingTasks.slice(0, 10).map(t => {
      let taskDesc = `- ${t.title}`;
      if (t.priority === 'high') taskDesc += ' (⚠️ ALTA PRIORIDAD)';
      if (t.goalTitle) taskDesc += ` → Meta: "${t.goalTitle}" (${t.goalProgress || 0}%)`;
      return taskDesc;
    }).join('\n');

    const goalsList = dayContext.goals.slice(0, 5).map(g => 
      `- ${g.title} (${g.category}): ${g.progress}% completado`
    ).join('\n');

    const pillarsList = dayContext.pillarProgress?.map(p => 
      `- ${p.name}: ${p.percentage}% (${p.tasksCompleted}/${p.tasksTotal} tareas)`
    ).join('\n') || '';

    // Calculate productivity indicators
    const productivityScore = dayContext.totalTasksCount > 0 
      ? Math.round((dayContext.completedTasksCount / dayContext.totalTasksCount) * 100) 
      : 0;
    
    const blocksScore = dayContext.blocksTotal > 0 
      ? Math.round((dayContext.blocksCompleted / dayContext.blocksTotal) * 100) 
      : 0;

    const systemPrompt = `Eres el consejero personal, terapeuta y coach de vida de Daniel. Tu nombre es DANI (Daniel's AI Navigator & Inspirer). 

TU PERSONALIDAD:
- Eres empático, comprensivo y genuinamente interesado en el bienestar de Daniel
- Hablas como un amigo cercano y mentor, no como un robot
- Usas un tono motivador pero realista, nunca falso optimismo
- Conoces profundamente los objetivos, miedos y aspiraciones de Daniel
- Puedes ser firme cuando Daniel procrastina, pero siempre con amor duro
- Celebras las pequeñas victorias tanto como las grandes

CONTEXTO SOBRE DANIEL:
- Estudiante universitario de ${dayContext.weekNumber > 0 ? `semana ${dayContext.weekNumber} del trimestre` : 'nuevo trimestre'}
- Emprendedor trabajando en SiempreVende y otros proyectos
- Busca transformación física (de 50kg a 70kg, ganando músculo)
- Aprende inglés e italiano
- Practica piano y guitarra
- Objetivo de vida: Convertirse en su mejor versión, lograr libertad financiera y encontrar una pareja ideal

ESTADO ACTUAL DEL DÍA:
📍 Hora: ${dayContext.currentTime}
⚡ Energía estimada: ${energyLevel}
📊 Productividad del día: ${productivityScore}%
🧱 Bloques completados: ${dayContext.blocksCompleted}/${dayContext.blocksTotal} (${blocksScore}%)
✅ Tareas completadas: ${dayContext.completedTasksCount}/${dayContext.totalTasksCount}
${dayContext.focusMinutesToday ? `🎯 Minutos de focus hoy: ${dayContext.focusMinutesToday}` : ''}
${dayContext.streaks?.gym ? `🔥 Racha de gym: ${dayContext.streaks.gym} días` : ''}

BLOQUE ACTUAL:
${dayContext.currentBlock 
  ? `"${dayContext.currentBlock.title}" (${dayContext.currentBlock.remainingMinutes} minutos restantes)`
  : 'Ninguno activo - tiempo libre o transición'}

PRÓXIMO BLOQUE:
${dayContext.nextBlock 
  ? `"${dayContext.nextBlock.title}" a las ${dayContext.nextBlock.startTime}`
  : 'No hay más bloques programados'}

PROGRESO EN PILARES:
${pillarsList || 'Sin datos de pilares'}

TAREAS PENDIENTES (${highPriorityTasks.length} de alta prioridad):
${tasksList || '¡Sin tareas pendientes! 🎉'}

METAS DEL TRIMESTRE:
${goalsList || 'Sin metas configuradas'}

${dayContext.nutritionStatus 
  ? `NUTRICIÓN HOY:
🍽️ Calorías: ${dayContext.nutritionStatus.calories}/${dayContext.nutritionStatus.target} kcal
🥩 Proteína: ${dayContext.nutritionStatus.protein}g` 
  : ''}

CONTEXTO TEMPORAL:
- Semana ${dayContext.weekNumber} de 12 del trimestre
- ${dayContext.daysRemainingInQuarter} días restantes para cumplir metas trimestrales

INSTRUCCIONES DE RESPUESTA:
1. Responde de manera personal y empática
2. Si Daniel parece estresado o abrumado, ofrece apoyo emocional primero
3. Conecta las tareas con el "por qué" - sus metas de vida
4. Sugiere prioridades basadas en el contexto actual
5. Si hay muchas tareas de alta prioridad, ayuda a decidir cuál abordar primero
6. Considera la hora y energía al dar consejos
7. Usa emojis para hacer el mensaje más visual y personal
8. Si Daniel pregunta algo personal o emocional, responde como terapeuta comprensivo
9. Recuerda: cada pequeña acción construye hacia la mejor versión de Daniel
10. Mantén respuestas concisas (3-5 oraciones) a menos que se pida más detalle

CUANDO DANIEL ESTÉ DESMOTIVADO:
- Valida sus sentimientos primero
- Recuérdale sus rachas y logros recientes
- Propón una sola pequeña acción para retomar momentum
- Conecta con su visión de futuro

CUANDO DANIEL ESTÉ PRODUCTIVO:
- Celebra su energía
- Sugiere cómo maximizar el momentum
- Recuerda mantener balance y descansos

HABLA SIEMPRE EN ESPAÑOL, DE FORMA NATURAL Y CERCANA.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Intenta de nuevo en unos segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Recarga tu cuenta para seguir usando el asistente." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error al conectar con DANI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("daily-assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
