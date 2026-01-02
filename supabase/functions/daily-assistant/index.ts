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

    // Build context about the day
    const currentHour = parseInt(dayContext.currentTime.split(':')[0]);
    const energyLevel = currentHour < 10 ? "alta" : currentHour < 14 ? "media-alta" : currentHour < 18 ? "media" : "baja";
    
    const pendingTasks = dayContext.tasks.filter(t => !t.completed);
    const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');
    
    const tasksList = pendingTasks.map(t => {
      let taskDesc = `- ${t.title}`;
      if (t.priority === 'high') taskDesc += ' (⚠️ ALTA PRIORIDAD)';
      if (t.goalTitle) taskDesc += ` → Meta: "${t.goalTitle}" (${t.goalProgress || 0}% completado)`;
      return taskDesc;
    }).join('\n');

    const goalsList = dayContext.goals.map(g => 
      `- ${g.title} (${g.category}): ${g.progress}% completado`
    ).join('\n');

    const systemPrompt = `Eres un asistente de productividad personal para Daniel. Tu rol es ayudarlo a tomar buenas decisiones durante su día, priorizando tareas y manteniéndolo motivado.

CONTEXTO DEL DÍA:
- Hora actual: ${dayContext.currentTime}
- Nivel de energía estimado: ${energyLevel} (basado en la hora)
- Bloque actual: ${dayContext.currentBlock ? `"${dayContext.currentBlock.title}" (${dayContext.currentBlock.remainingMinutes} minutos restantes)` : 'Ninguno activo'}
- Próximo bloque: ${dayContext.nextBlock ? `"${dayContext.nextBlock.title}" a las ${dayContext.nextBlock.startTime}` : 'No hay más bloques'}

PROGRESO DEL DÍA:
- Bloques completados: ${dayContext.blocksCompleted}/${dayContext.blocksTotal}
- Tareas completadas: ${dayContext.completedTasksCount}/${dayContext.totalTasksCount}
- Tareas de alta prioridad pendientes: ${highPriorityTasks.length}

TAREAS PENDIENTES:
${tasksList || '(Ninguna tarea pendiente)'}

METAS DEL TRIMESTRE:
${goalsList || '(Sin metas configuradas)'}

CONTEXTO TEMPORAL:
- Semana ${dayContext.weekNumber} de 12 del trimestre actual
- Días restantes en el trimestre: ${dayContext.daysRemainingInQuarter}

REGLAS DE RESPUESTA:
1. Sé conciso y directo (máximo 3-4 oraciones)
2. Siempre conecta las sugerencias con las metas cuando sea relevante
3. Considera el nivel de energía según la hora del día
4. Si hay tareas de alta prioridad, menciónalas primero
5. Usa emojis para hacer el mensaje más visual
6. Si el usuario parece desmotivado, sé empático pero enfocado
7. Recuerda que cada tarea contribuye a una meta mayor

PERSONALIDAD:
- Motivador pero realista
- Conoce bien a Daniel y sus objetivos
- Sabe que Daniel busca aprobar exámenes, emprender y mantenerse en forma
- Habla en español, de forma natural y cercana`;

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
      return new Response(JSON.stringify({ error: "Error al conectar con el asistente IA" }), {
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
