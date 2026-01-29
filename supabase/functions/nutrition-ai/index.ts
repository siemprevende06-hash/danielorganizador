import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, currentWeight, targetWeight, dailyGoals } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un nutricionista deportivo experto especializado en aumento de masa muscular.

CONTEXTO DEL USUARIO:
- Peso actual: ${currentWeight || 50}kg
- Peso objetivo: ${targetWeight || 70}kg (ganancia de masa muscular)
- Meta diaria: ${dailyGoals?.calories || 3200} kcal, ${dailyGoals?.protein || 150}g proteína

TU TAREA:
Cuando el usuario describa lo que comió, debes:
1. Estimar las calorías totales de la comida
2. Estimar los gramos de proteína
3. Estimar los gramos de carbohidratos
4. Estimar los gramos de grasa
5. Dar un consejo breve y motivador relacionado con su objetivo de ganar peso

IMPORTANTE:
- Sé preciso pero generoso en las estimaciones (es mejor sobrestimar un poco para alguien que quiere ganar peso)
- El consejo debe ser en español, positivo y orientado a su meta de ganar músculo
- Si la descripción es vaga, asume porciones normales-grandes

RESPONDE ÚNICAMENTE en este formato JSON exacto:
{
  "calories": número,
  "protein": número,
  "carbs": número,
  "fat": número,
  "advice": "string con consejo motivador"
}`;

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
          { role: "user", content: `Analiza esta comida: ${description}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let nutritionData;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
      // Fallback with reasonable estimates
      nutritionData = {
        calories: 400,
        protein: 20,
        carbs: 50,
        fat: 15,
        advice: "¡Sigue alimentándote bien para alcanzar tu meta de peso! 💪",
      };
    }

    return new Response(JSON.stringify(nutritionData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("nutrition-ai error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        // Fallback data
        calories: 350,
        protein: 15,
        carbs: 45,
        fat: 12,
        advice: "Registro guardado. ¡Sigue comiendo bien! 💪",
      }),
      {
        status: 200, // Return 200 with fallback data
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
