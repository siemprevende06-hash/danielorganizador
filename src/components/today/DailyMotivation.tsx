import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, RefreshCw } from "lucide-react";

const MOTIVATIONAL_QUOTES = [
  { text: "La disciplina es elegir entre lo que quieres ahora y lo que más quieres.", author: "Abraham Lincoln" },
  { text: "No cuentes los días, haz que los días cuenten.", author: "Muhammad Ali" },
  { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
  { text: "La única forma de hacer un gran trabajo es amar lo que haces.", author: "Steve Jobs" },
  { text: "Cada día es una nueva oportunidad para cambiar tu vida.", author: "Anónimo" },
  { text: "El secreto para avanzar es comenzar.", author: "Mark Twain" },
  { text: "Tu futuro es creado por lo que haces hoy, no mañana.", author: "Robert Kiyosaki" },
  { text: "La excelencia no es un acto, sino un hábito.", author: "Aristóteles" },
  { text: "Haz hoy lo que otros no quieren, haz mañana lo que otros no pueden.", author: "Jerry Rice" },
  { text: "El dolor es temporal, la gloria es para siempre.", author: "Anónimo" }
];

export function DailyMotivation() {
  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [personalGoal, setPersonalGoal] = useState<string | null>(null);

  useEffect(() => {
    // Get a consistent quote for the day based on date
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % MOTIVATIONAL_QUOTES.length;
    setQuote(MOTIVATIONAL_QUOTES[quoteIndex]);

    loadPersonalGoal();
  }, []);

  const loadPersonalGoal = async () => {
    const quarter = Math.ceil((new Date().getMonth() + 1) / 3);
    
    const { data: goal } = await supabase
      .from('twelve_week_goals')
      .select('title')
      .eq('quarter', quarter)
      .eq('year', 2026)
      .eq('status', 'active')
      .order('progress_percentage', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (goal) {
      setPersonalGoal(goal.title);
    }
  };

  const refreshQuote = () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  };

  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-warning" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recordatorio del Día
          </span>
        </div>
        <button 
          onClick={refreshQuote}
          className="p-1 hover:bg-muted rounded transition-colors"
          title="Nueva frase"
        >
          <RefreshCw className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <blockquote className="text-sm italic text-foreground mb-1">
        "{quote.text}"
      </blockquote>
      <p className="text-xs text-muted-foreground text-right">— {quote.author}</p>

      {personalGoal && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Tu meta prioritaria:</strong> {personalGoal}
          </p>
        </div>
      )}
    </div>
  );
}
