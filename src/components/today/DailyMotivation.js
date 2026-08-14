import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, RefreshCw } from "lucide-react";
const MOTIVATIONAL_QUOTES = [
    { text: "No le temas al fracaso. Teme que la oportunidad no exista y todavía la tienes.", author: "Anónimo" },
    { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
    { text: "La disciplina es elegir entre lo que quieres ahora y lo que más quieres.", author: "Abraham Lincoln" },
    { text: "No cuentes los días, haz que los días cuenten.", author: "Muhammad Ali" },
    { text: "La única forma de hacer un gran trabajo es amar lo que haces.", author: "Steve Jobs" },
    { text: "Cada día es una nueva oportunidad para cambiar tu vida.", author: "Anónimo" },
    { text: "El secreto para avanzar es comenzar.", author: "Mark Twain" },
    { text: "Tu futuro es creado por lo que haces hoy, no mañana.", author: "Robert Kiyosaki" },
    { text: "La excelencia no es un acto, sino un hábito.", author: "Aristóteles" },
    { text: "Haz hoy lo que otros no quieren, haz mañana lo que otros no pueden.", author: "Jerry Rice" },
    { text: "El dolor es temporal, la gloria es para siempre.", author: "Anónimo" },
    { text: "No se trata de tener tiempo, se trata de tener disciplina.", author: "James Clear" },
    { text: "Si no diseñas tu propio plan de vida, probablemente caerás en el plan de otro.", author: "Jim Rohn" },
    { text: "El nivel más alto de sabiduría es saber que no sabes nada.", author: "Sócrates" },
    { text: "La riqueza no consiste en tener muchas posesiones, sino en tener pocas necesidades.", author: "Epicteto" },
    { text: "Invertir en ti mismo es lo mejor que puedes hacer.", author: "Warren Buffett" },
    { text: "El miedo es solo una reacción. El coraje es una decisión.", author: "Jordan B. Peterson" },
    { text: "No esperes. El momento nunca será el adecuado.", author: "Napoleon Hill" },
    { text: "Primero ellos te ignoran, luego se ríen de ti, luego te atacan, luego ganas.", author: "Mahatma Gandhi" },
    { text: "El mejor momento para plantar un árbol fue hace 20 años. El segundo mejor momento es ahora.", author: "Proverbio chino" },
    { text: "Tu vida no mejora por casualidad, mejora por cambio.", author: "Jim Rohn" },
    { text: "Si quieres algo que nunca has tenido, debes hacer algo que nunca has hecho.", author: "Anónimo" },
    { text: "El éxito no es definitivo, el fracaso no es fatal: es el coraje de continuar lo que cuenta.", author: "Winston Churchill" },
    { text: "La persona que lee vive mil vidas. La que no lee vive solo una.", author: "George R.R. Martin" },
    { text: "No puedes conectar los puntos mirando hacia adelante; solo puedes conectarlos mirando hacia atrás.", author: "Steve Jobs" },
    { text: "La mayoría de la gente sobreestima lo que puede hacer en un año y subestima lo que puede hacer en diez.", author: "Bill Gates" },
    { text: "El hábito es el mejor de los sirvientes o el peor de los amos.", author: "Anónimo" },
    { text: "La paciencia no es la capacidad de esperar, sino la capacidad de mantener una buena actitud mientras esperas.", author: "Anónimo" },
    { text: "El dinero es un pésimo amo pero un excelente sirviente.", author: "P.T. Barnum" },
    { text: "La libertad financiera no es tener dinero, es tener opciones.", author: "Robert Kiyosaki" },
    { text: "No trabajes por dinero, haz que el dinero trabaje para ti.", author: "Robert Kiyosaki" },
    { text: "El 80% del éxito se basa en simplemente aparecer.", author: "Woody Allen" },
    { text: "Todo lo que siempre has querido está al otro lado del miedo.", author: "Anónimo" },
    { text: "La manera de empezar es dejar de hablar y empezar a hacer.", author: "Walt Disney" },
    { text: "El único modo de hacer un gran trabajo es amar lo que haces.", author: "Steve Jobs" },
    { text: "Si te caíste ayer, levántate hoy.", author: "H.G. Wells" },
    { text: "No dejes que lo que no puedes hacer interfiera con lo que sí puedes hacer.", author: "John Wooden" },
    { text: "La acción es la clave fundamental de todo éxito.", author: "Pablo Picasso" },
    { text: "Un viaje de mil millas comienza con un solo paso.", author: "Lao Tzu" },
    { text: "Haz lo que puedas, con lo que tengas, donde estés.", author: "Theodore Roosevelt" },
    { text: "La diferencia entre lo imposible y lo posible radica en la determinación de una persona.", author: "Tommy Lasorda" },
    { text: "Que no muera tu ambición, que no muera tu impulso, que no mueran tus ganas de conquistar todo lo que te propongas.", author: "Anónimo" },
    { text: "Si no arriesgas nada, arriesgas todo.", author: "Anónimo" },
    { text: "La consistencia es más importante que la perfección.", author: "James Clear" },
    { text: "Cada hábito atómico es una pequeña inversión en la persona en la que te quieres convertir.", author: "James Clear" },
    { text: "El mejor momento para empezar una nueva rutina es hoy. No mañana, no el lunes, hoy.", author: "Anónimo" },
    { text: "Tu zona de confort te mantiene estancado. Sal de ella.", author: "Anónimo" },
    { text: "Compórtate como si el éxito fuera inevitable.", author: "Anónimo" },
    { text: "La duda mata más sueños de los que el fracaso jamás matará.", author: "Suzy Kassem" },
    { text: "El orgullo divide, la humildad une. El ego dice 'yo lo logré', la sabiduría dice 'lo logramos'.", author: "Anónimo" },
    { text: "No es la carga lo que te rompe, es cómo la llevas.", author: "Lou Holtz" },
    { text: "Cuanto más sudas en la paz, menos sangras en la guerra.", author: "Anónimo" },
    { text: "El éxito no se mide por lo que logras, sino por los obstáculos que superas.", author: "Booker T. Washington" },
    { text: "El conocimiento sin acción es inútil. La acción sin conocimiento es peligrosa.", author: "Anónimo" },
    { text: "Invertir en conocimiento paga el mejor interés.", author: "Benjamin Franklin" },
    { text: "Si buscas resultados distintos, no hagas siempre lo mismo.", author: "Albert Einstein" },
    { text: "Primero forma tu carácter, luego tu reputación. El carácter es quien eres, la reputación es quien la gente cree que eres.", author: "John Wooden" },
    { text: "El hombre que mueve montañas empieza moviendo pequeñas piedras.", author: "Confucio" },
    { text: "Tu tiempo es limitado, no lo desperdicies viviendo la vida de alguien más.", author: "Steve Jobs" },
    { text: "No es la especie más fuerte la que sobrevive, ni la más inteligente, sino la que responde mejor al cambio.", author: "Charles Darwin" },
    { text: "El pesimista se queja del viento, el optimista espera que cambie, el realista ajusta las velas.", author: "William Arthur Ward" },
    { text: "No puedes cambiar el viento, pero puedes ajustar las velas.", author: "Proverbio" },
    { text: "La mejor venganza es tener éxito.", author: "Anónimo" },
    { text: "El cielo no limita tus alas, tú pones tus propios límites.", author: "Anónimo" },
    { text: "El fracaso es una gran oportunidad para empezar de nuevo con más inteligencia.", author: "Henry Ford" },
    { text: "Tus ingresos nunca superarán tu desarrollo personal.", author: "Jim Rohn" },
    { text: "El trabajo duro vence al talento cuando el talento no trabaja duro.", author: "Tim Notke" },
    { text: "La vida no se trata de encontrarte a ti mismo, sino de crearte a ti mismo.", author: "George Bernard Shaw" },
    { text: "Hasta que no hagas consciente tu inconsciente, seguirá dirigiendo tu vida y lo llamarás destino.", author: "Carl Jung" },
    { text: "Lo que niegas te somete; lo que aceptas te transforma.", author: "Carl Jung" },
    { text: "Entre el estímulo y la respuesta hay un espacio. En ese espacio está nuestro poder de elegir nuestra respuesta.", author: "Viktor Frankl" },
    { text: "Al que le importa el porqué de su vida, es capaz de soportar casi cualquier cómo.", author: "Friedrich Nietzsche" },
    { text: "No todo lo que enfrentamos puede cambiar, pero nada cambia hasta que lo enfrentamos.", author: "James Baldwin" },
    { text: "No eres tus pensamientos. Eres la conciencia que los observa.", author: "Eckhart Tolle" },
    { text: "Miedo y peligro no son lo mismo. El peligro es real, el miedo es una elección.", author: "Anónimo" },
    { text: "El precio de la disciplina siempre será menor que el dolor del arrepentimiento.", author: "Anónimo" },
    { text: "No se puede agotar la creatividad. Cuanto más usas, más tienes.", author: "Maya Angelou" },
    { text: "Corre cuando puedas, camina si es necesario, arrástrate si no queda otro remedio, pero nunca te rindas.", author: "Anónimo" },
    { text: "La vida es 10% lo que te sucede y 90% cómo reaccionas ante ello.", author: "Charles R. Swindoll" },
    { text: "Los grandes espíritus siempre han encontrado oposición violenta de mentes mediocres.", author: "Albert Einstein" },
    { text: "La mayor gloria no es nunca caer, sino levantarse cada vez que caemos.", author: "Confucio" },
    { text: "A veces la pregunta correcta es más importante que la respuesta correcta.", author: "Anónimo" },
    { text: "Si quieres ir rápido, ve solo. Si quieres llegar lejos, ve acompañado.", author: "Proverbio africano" },
    { text: "No tengas miedo de renunciar a lo bueno para ir por lo grandioso.", author: "John D. Rockefeller" },
    { text: "Tu actitud, no tu aptitud, determinará tu altitud.", author: "Zig Ziglar" },
    { text: "El dinero sin inteligencia emocional te destruye. La inteligencia sin dinero te limita. Ambos juntos te hacen imparable.", author: "Anónimo" },
    { text: "Las oportunidades no ocurren. Las creas.", author: "Chris Grosser" },
    { text: "No leas lo que otros hacen. Lee lo que otros leen y haz lo que otros no hacen.", author: "Anónimo" },
    { text: "El que tiene un porqué para vivir, puede soportar casi cualquier cómo.", author: "Friedrich Nietzsche" },
    { text: "Si no puedes explicarlo de forma sencilla, no lo entiendes lo suficientemente bien.", author: "Albert Einstein" },
    { text: "El valor no es la ausencia de miedo, sino el triunfo sobre él.", author: "Nelson Mandela" },
    { text: "No importa cuántas veces fracases, solo importa que tengas razón una vez.", author: "Anónimo" },
    { text: "Tu tiempo en la tierra es limitado. No lo pierdas viviendo la vida de otro.", author: "Anónimo" },
    { text: "Cuida tus pensamientos, porque se vuelven palabras. Cuida tus palabras, porque se vuelven acciones. Cuida tus acciones, porque se vuelven hábitos. Cuida tus hábitos, porque se vuelven tu destino.", author: "Lao Tzu" },
    { text: "El propósito de la vida no es ser feliz. Es ser útil, ser honorable, ser compasivo.", author: "Anónimo" },
    { text: "En medio del caos, también hay oportunidad.", author: "Sun Tzu" },
    { text: "Supérate a ti mismo cada día. No compitas con nadie, compite con quien fuiste ayer.", author: "Anónimo" },
    { text: "Lo más importante es no dejar de hacerse preguntas.", author: "Albert Einstein" },
];
export function DailyMotivation() {
    const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0]);
    const [personalGoal, setPersonalGoal] = useState(null);
    const [index, setIndex] = useState(0);
    const intervalRef = useRef();
    useEffect(() => {
        const seed = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        setIndex(seed);
        setQuote(MOTIVATIONAL_QUOTES[seed]);
        loadPersonalGoal();
        intervalRef.current = setInterval(() => {
            setIndex(prev => {
                const next = (prev + 1) % MOTIVATIONAL_QUOTES.length;
                setQuote(MOTIVATIONAL_QUOTES[next]);
                return next;
            });
        }, 15000);
        return () => {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
        };
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
        if (goal)
            setPersonalGoal(goal.title);
    };
    const refreshQuote = () => {
        const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        setIndex(randomIndex);
        setQuote(MOTIVATIONAL_QUOTES[randomIndex]);
    };
    return (_jsxs("div", { className: "bg-gradient-to-r from-amber-500/5 via-primary/5 to-purple-500/5 rounded-lg p-4 border border-border", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Lightbulb, { className: "w-4 h-4 text-amber-500" }), _jsx("span", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: "Frase del momento" })] }), _jsx("button", { onClick: refreshQuote, className: "p-1 hover:bg-muted rounded transition-colors", title: "Siguiente frase", children: _jsx(RefreshCw, { className: "w-3 h-3 text-muted-foreground" }) })] }), _jsxs("blockquote", { className: "text-sm italic text-foreground mb-1 leading-relaxed", children: ["\"", quote.text, "\""] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-xs text-muted-foreground", children: ["\u2014 ", quote.author] }), _jsxs("p", { className: "text-[10px] text-muted-foreground/50", children: [index + 1, "/", MOTIVATIONAL_QUOTES.length] })] }), personalGoal && (_jsx("div", { className: "mt-3 pt-3 border-t border-border", children: _jsxs("p", { className: "text-xs text-muted-foreground", children: [_jsx("strong", { children: "Tu meta prioritaria:" }), " ", personalGoal] }) }))] }));
}
