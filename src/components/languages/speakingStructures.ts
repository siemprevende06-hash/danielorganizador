import { Briefcase, Coffee, Compass, HeartHandshake, MessageSquareQuote, Scale, Sparkles, Stethoscope } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Language } from '@/hooks/useLanguageLearning';

export type StructureCategory = 'entrevista' | 'dia' | 'opinion' | 'historia' | 'servicio' | 'personalizada';

export interface StructureStep {
  /** Nombre del paso en español (2-4 palabras). */
  label: string;
  /** Plantilla en el idioma objetivo con huecos para completar. */
  template: Record<Language, string>;
  /** Consejo breve en español. */
  tip: string;
}

export interface SpeakingStructure {
  id: string;
  category: StructureCategory;
  question: Record<Language, string>;
  questionEs: string;
  /** Objetivo de la respuesta, en español. */
  goal: string;
  steps: StructureStep[];
  /** Expresiones útiles en el idioma objetivo. */
  phrases: Record<Language, string[]>;
  example: Record<Language, string>;
  exampleEs: string;
  custom?: boolean;
}

export const STRUCTURE_CATEGORIES: { id: StructureCategory; label: string; Icon: LucideIcon }[] = [
  { id: 'entrevista', label: 'Entrevista', Icon: Briefcase },
  { id: 'dia', label: 'Día a día', Icon: Coffee },
  { id: 'opinion', label: 'Opinión', Icon: Scale },
  { id: 'historia', label: 'Historias', Icon: Compass },
  { id: 'servicio', label: 'Servicios', Icon: Stethoscope },
  { id: 'personalizada', label: 'Mis estructuras', Icon: Sparkles },
];

export const SPEAKING_STRUCTURES: SpeakingStructure[] = [
  {
    id: 'about-me',
    category: 'entrevista',
    question: {
      english: 'Tell me about yourself.',
      italian: 'Parlami di te.',
    },
    questionEs: 'Háblame de ti.',
    goal: 'Presentarte en 30-45 segundos: quién eres, qué haces, un logro y qué buscas ahora.',
    steps: [
      {
        label: 'Presente',
        template: {
          english: "I'm ... and I ...",
          italian: 'Sono ... e ...',
        },
        tip: 'Nombre, ciudad y ocupación en una sola frase.',
      },
      {
        label: 'Experiencia',
        template: {
          english: "I've been working/studying ... for ...",
          italian: 'Lavoro/Studio ... da ...',
        },
        tip: 'Una línea con lo que haces y cuánto tiempo llevas.',
      },
      {
        label: 'Logro',
        template: {
          english: "One thing I'm proud of is ...",
          italian: 'Una cosa di cui sono orgoglioso è ...',
        },
        tip: 'Un resultado concreto, con un número si puedes.',
      },
      {
        label: 'Objetivo',
        template: {
          english: "Right now I'm looking for ... because ...",
          italian: 'Adesso cerco ... perché ...',
        },
        tip: 'Conecta tu objetivo con el puesto o con la conversación.',
      },
    ],
    phrases: {
      english: ['I’m originally from...', 'I’ve been ... for ... years', 'What I enjoy most is...', 'I’m currently focused on...'],
      italian: ['Vengo da...', 'Faccio ... da ... anni', 'Quello che mi piace di più è...', 'Al momento mi concentro su...'],
    },
    example: {
      english:
        "I'm Daniel, I'm from Cuba and I work as a software developer. I've been building web apps for three years, and one thing I'm proud of is launching an app that now helps hundreds of students. Right now I'm looking for a role where I can keep growing as a developer.",
      italian:
        "Sono Daniel, vengo da Cuba e lavoro come sviluppatore software. Da tre anni costruisco applicazioni web e una cosa di cui sono orgoglioso è aver lanciato un'app che oggi aiuta centinaia di studenti. Adesso cerco un ruolo in cui poter continuare a crescere come sviluppatore.",
    },
    exampleEs:
      'Soy Daniel, soy de Cuba y trabajo como desarrollador de software. Llevo tres años creando aplicaciones web y algo de lo que estoy orgulloso es haber lanzado una app que hoy ayuda a cientos de estudiantes. Ahora busco un puesto donde pueda seguir creciendo como desarrollador.',
  },
  {
    id: 'why-job',
    category: 'entrevista',
    question: {
      english: 'Why do you want this job?',
      italian: 'Perché vuoi questo lavoro?',
    },
    questionEs: '¿Por qué quieres este trabajo?',
    goal: 'Unir motivación, encaje con el puesto y una aportación concreta. Evita respuestas genéricas.',
    steps: [
      {
        label: 'Motivación',
        template: {
          english: "I'm interested in this role because ...",
          italian: 'Mi interessa questo ruolo perché ...',
        },
        tip: 'Un motivo real: el producto, el equipo o el tipo de trabajo.',
      },
      {
        label: 'Encaje',
        template: {
          english: 'My experience in ... matches ...',
          italian: 'La mia esperienza in ... corrisponde a ...',
        },
        tip: 'Conecta una habilidad tuya con una necesidad del puesto.',
      },
      {
        label: 'Aportación',
        template: {
          english: "I'd like to contribute by ...",
          italian: 'Vorrei contribuire ...',
        },
        tip: 'Di qué harías en los primeros meses.',
      },
    ],
    phrases: {
      english: ['What attracts me most is...', 'I have experience in...', 'I could help the team by...', 'I’m especially interested in...'],
      italian: ['Quello che mi attira di più è...', 'Ho esperienza in...', 'Potrei aiutare il team a...', 'Mi interessa soprattutto...'],
    },
    example: {
      english:
        "I'm interested in this role because the product solves a real problem for students. My experience in front-end development matches what you need, and I'd like to contribute by improving the onboarding so new users understand the app faster.",
      italian:
        "Mi interessa questo ruolo perché il prodotto risolve un problema reale per gli studenti. La mia esperienza nello sviluppo front-end corrisponde a ciò che cercate e vorrei contribuire migliorando l'onboarding, così i nuovi utenti capiscono l'app più in fretta.",
    },
    exampleEs:
      'Me interesa este puesto porque el producto resuelve un problema real para estudiantes. Mi experiencia en desarrollo front-end encaja con lo que necesitan y me gustaría aportar mejorando el onboarding para que los nuevos usuarios entiendan la app más rápido.',
  },
  {
    id: 'strengths-weaknesses',
    category: 'entrevista',
    question: {
      english: 'What are your strengths and weaknesses?',
      italian: 'Quali sono i tuoi punti di forza e di debolezza?',
    },
    questionEs: '¿Cuáles son tus fortalezas y debilidades?',
    goal: 'Una fortaleza con prueba y una debilidad real con un plan de mejora. Sin clichés.',
    steps: [
      {
        label: 'Fortaleza',
        template: {
          english: 'One of my strengths is ... For example, ...',
          italian: 'Uno dei miei punti di forza è ... Per esempio, ...',
        },
        tip: 'Elige una fortaleza útil para el puesto y demuéstrala con un hecho.',
      },
      {
        label: 'Debilidad',
        template: {
          english: "A weakness I'm working on is ... I've started ...",
          italian: 'Una debolezza su cui sto lavorando è ... Ho iniziato a ...',
        },
        tip: 'Que sea real y que se vea que ya estás actuando.',
      },
      {
        label: 'Equilibrio',
        template: {
          english: 'I try to balance ... by ...',
          italian: 'Cerco di bilanciare ... ...',
        },
        tip: 'Cierra con cómo evitas que esa debilidad te frene.',
      },
    ],
    phrases: {
      english: ['I’m good at...', 'I’ve learned to...', 'I’m working on...', 'What helps me is...'],
      italian: ['Sono bravo a...', 'Ho imparato a...', 'Sto lavorando su...', 'Quello che mi aiuta è...'],
    },
    example: {
      english:
        "One of my strengths is communicating with clients. For example, in my last project I translated technical ideas into simple language and we closed the deal. A weakness I'm working on is saying no; I've started blocking time for deep work, and I try to balance my availability by planning my week in advance.",
      italian:
        "Uno dei miei punti di forza è comunicare con i clienti. Per esempio, nel mio ultimo progetto ho tradotto idee tecniche in un linguaggio semplice e abbiamo chiuso l'accordo. Una debolezza su cui sto lavorando è dire di no; ho iniziato a bloccare del tempo per il lavoro profondo e cerco di bilanciare la mia disponibilità pianificando la settimana in anticipo.",
    },
    exampleEs:
      'Una de mis fortalezas es comunicar con clientes. Por ejemplo, en mi último proyecto traduje ideas técnicas a un lenguaje sencillo y cerramos el acuerdo. Una debilidad en la que estoy trabajando es decir que no; empecé a bloquear tiempo para trabajo profundo y trato de equilibrar mi disponibilidad planificando la semana con antelación.',
  },
  {
    id: 'challenge-star',
    category: 'historia',
    question: {
      english: 'Describe a challenge you overcame.',
      italian: 'Descrivi una sfida che hai superato.',
    },
    questionEs: 'Describe un reto que superaste.',
    goal: 'Contar una historia concreta con la estructura STAR: situación, tarea, acción y resultado.',
    steps: [
      {
        label: 'Situación',
        template: {
          english: 'A few months ago, ...',
          italian: 'Qualche mese fa, ...',
        },
        tip: 'Cuándo, dónde y con quién. Una o dos frases.',
      },
      {
        label: 'Tarea',
        template: {
          english: 'My goal was to ...',
          italian: 'Il mio obiettivo era ...',
        },
        tip: 'Qué tenías que conseguir exactamente.',
      },
      {
        label: 'Acción',
        template: {
          english: 'What I did was ... First, ... Then, ...',
          italian: 'Quello che ho fatto è stato ... Prima, ... Poi, ...',
        },
        tip: 'Pasos concretos que diste tú, no el equipo.',
      },
      {
        label: 'Resultado',
        template: {
          english: 'In the end, ... and I learned ...',
          italian: 'Alla fine, ... e ho imparato ...',
        },
        tip: 'Un resultado medible y una lección breve.',
      },
    ],
    phrases: {
      english: ['The main problem was...', 'I decided to...', 'As a result,...', 'Looking back, I learned...'],
      italian: ['Il problema principale era...', 'Ho deciso di...', 'Di conseguenza,...', 'Ripensandoci, ho imparato...'],
    },
    example: {
      english:
        "A few months ago, our app was losing users during sign-up. My goal was to reduce drop-off in two weeks. What I did was watch user sessions, simplify the form and test a new flow with five people. In the end, drop-off fell by 30 percent and I learned that testing with real users saves days of guessing.",
      italian:
        "Qualche mese fa, la nostra app perdeva utenti durante la registrazione. Il mio obiettivo era ridurre le abbandoni in due settimane. Quello che ho fatto è stato guardare le sessioni degli utenti, semplificare il modulo e testare un nuovo flusso con cinque persone. Alla fine, le abbandoni sono calate del 30 percento e ho imparato che testare con utenti reali fa risparmiare giorni di ipotesi.",
    },
    exampleEs:
      'Hace unos meses, nuestra app perdía usuarios durante el registro. Mi objetivo era reducir el abandono en dos semanas. Lo que hice fue observar sesiones de usuarios, simplificar el formulario y probar un flujo nuevo con cinco personas. Al final, el abandono bajó un 30 % y aprendí que probar con usuarios reales ahorra días de suposiciones.',
  },
  {
    id: 'trip-story',
    category: 'historia',
    question: {
      english: 'Tell me about a memorable trip.',
      italian: 'Raccontami un viaggio indimenticabile.',
    },
    questionEs: 'Cuéntame un viaje inolvidable.',
    goal: 'Una historia corta con contexto, anécdota y reflexión. Usa pasados simples y conectores.',
    steps: [
      {
        label: 'Contexto',
        template: {
          english: 'I went to ... with ... in ...',
          italian: 'Sono andato/a a ... con ... nel ...',
        },
        tip: 'Lugar, compañía y época.',
      },
      {
        label: 'Anécdota',
        template: {
          english: 'One day, ...',
          italian: 'Un giorno, ...',
        },
        tip: 'Un momento concreto, no un resumen del viaje.',
      },
      {
        label: 'Impresión',
        template: {
          english: 'What surprised me most was ...',
          italian: 'Quello che mi ha sorpreso di più è stato ...',
        },
        tip: 'Una emoción o un detalle sensorial.',
      },
      {
        label: 'Reflexión',
        template: {
          english: "I'd go back because ...",
          italian: 'Ci tornerei perché ...',
        },
        tip: 'Cierra con por qué lo recuerdas.',
      },
    ],
    phrases: {
      english: ['It was worth it because...', 'I’ll never forget...', 'What I loved most was...', 'It changed the way I...'],
      italian: ['Ne è valsa la pena perché...', 'Non dimenticherò mai...', 'Quello che ho amato di più è...', 'Ha cambiato il modo in cui...'],
    },
    example: {
      english:
        "I went to Rome with my sister in 2023. One day, we got lost and ended up in a tiny restaurant where the owner taught us how to make pasta. What surprised me most was how kind everyone was. I'd go back because that trip taught me that the best plans are often unplanned.",
      italian:
        "Sono andato a Roma con mia sorella nel 2023. Un giorno ci siamo persi e siamo finiti in un piccolo ristorante dove il proprietario ci ha insegnato a fare la pasta. Quello che mi ha sorpreso di più è stata la gentilezza di tutti. Ci tornerei perché quel viaggio mi ha insegnato che i piani migliori spesso non sono programmati.",
    },
    exampleEs:
      'Fui a Roma con mi hermana en 2023. Un día nos perdimos y acabamos en un restaurante pequeño donde el dueño nos enseñó a hacer pasta. Lo que más me sorprendió fue la amabilidad de todos. Volvería porque ese viaje me enseñó que los mejores planes a menudo no se planifican.',
  },
  {
    id: 'free-time',
    category: 'dia',
    question: {
      english: 'What do you do in your free time?',
      italian: 'Cosa fai nel tempo libero?',
    },
    questionEs: '¿Qué haces en tu tiempo libre?',
    goal: 'Responder, añadir un detalle y devolver la pregunta. Es la base del small talk.',
    steps: [
      {
        label: 'Actividad',
        template: {
          english: 'In my free time I usually ...',
          italian: 'Nel tempo libero di solito ...',
        },
        tip: 'Una actividad concreta, no "I relax".',
      },
      {
        label: 'Detalle',
        template: {
          english: 'I especially enjoy ... because ...',
          italian: 'Mi piace soprattutto ... perché ...',
        },
        tip: 'Añade frecuencia, lugar o con quién.',
      },
      {
        label: 'Sensación',
        template: {
          english: 'It helps me ...',
          italian: 'Mi aiuta a ...',
        },
        tip: 'Qué te aporta: energía, calma, ideas...',
      },
      {
        label: 'Devolver',
        template: {
          english: 'What about you? Do you ...?',
          italian: 'E tu? ...?',
        },
        tip: 'Haz una pregunta para que la conversación siga.',
      },
    ],
    phrases: {
      english: ['I’m really into...', 'I try to ... every week', 'It’s a great way to...', 'How about you?'],
      italian: ['Mi appassiona molto...', 'Cerco di ... ogni settimana', 'È un ottimo modo per...', 'E tu?'],
    },
    example: {
      english:
        "In my free time I usually play chess and go running. I especially enjoy running in the morning because the city is quiet and I can think. It helps me start the day with energy. What about you? Do you do any sport?",
      italian:
        "Nel tempo libero di solito gioco a scacchi e vado a correre. Mi piace soprattutto correre la mattina perché la città è tranquilla e posso pensare. Mi aiuta a iniziare la giornata con energia. E tu? Fai qualche sport?",
    },
    exampleEs:
      'En mi tiempo libre suelo jugar al ajedrez y salir a correr. Disfruto sobre todo correr por la mañana porque la ciudad está tranquila y puedo pensar. Me ayuda a empezar el día con energía. ¿Y tú? ¿Haces algún deporte?',
  },
  {
    id: 'hometown',
    category: 'dia',
    question: {
      english: 'Describe your hometown.',
      italian: 'Descrivi la tua città natale.',
    },
    questionEs: 'Describe tu ciudad natal.',
    goal: 'Ubicar, destacar algo especial, contar un recuerdo y recomendar un plan.',
    steps: [
      {
        label: 'Ubicación',
        template: {
          english: 'My hometown is ... It’s in ...',
          italian: 'La mia città natale è ... Si trova in ...',
        },
        tip: 'Norte, sur, costa, montaña...',
      },
      {
        label: 'Lo especial',
        template: {
          english: 'What makes it special is ...',
          italian: 'Quello che la rende speciale è ...',
        },
        tip: 'Comida, gente, paisaje o ambiente.',
      },
      {
        label: 'Recuerdo',
        template: {
          english: 'I remember ... when I was ...',
          italian: 'Ricordo ... quando ero ...',
        },
        tip: 'Un recuerdo corto y concreto.',
      },
      {
        label: 'Recomendación',
        template: {
          english: 'If you visit, you should ...',
          italian: 'Se la visiti, dovresti ...',
        },
        tip: 'Un plan que no sea el típico de turista.',
      },
    ],
    phrases: {
      english: ['It’s known for...', 'It’s a great place to...', 'You can’t miss...', 'It feels like home because...'],
      italian: ['È famosa per...', 'È un ottimo posto per...', 'Non puoi perderti...', 'Mi sento a casa perché...'],
    },
    example: {
      english:
        "My hometown is a small city in the east of Cuba. What makes it special is the music and the way people talk on the street. I remember playing football outside until dark when I was a kid. If you visit, you should try the local coffee and walk around the old square at sunset.",
      italian:
        "La mia città natale è una piccola città nell'est di Cuba. Quello che la rende speciale è la musica e il modo in cui le persone parlano per strada. Ricordo di giocare a calcio fuori fino al buio quando ero bambino. Se la visiti, dovresti provare il caffè locale e passeggiare nella piazza vecchia al tramonto.",
    },
    exampleEs:
      'Mi ciudad natal es una ciudad pequeña en el este de Cuba. Lo que la hace especial es la música y la forma en que la gente habla en la calle. Recuerdo jugar al fútbol afuera hasta que oscurecía cuando era niño. Si la visitas, deberías probar el café local y pasear por la plaza vieja al atardecer.',
  },
  {
    id: 'opinion-prep',
    category: 'opinion',
    question: {
      english: 'What do you think about ...?',
      italian: 'Cosa ne pensi di ...?',
    },
    questionEs: '¿Qué opinas de ...?',
    goal: 'Dar una opinión con razón y ejemplo. Usa la estructura PREP: punto, razón, ejemplo, punto.',
    steps: [
      {
        label: 'Punto',
        template: {
          english: 'In my opinion, ...',
          italian: 'Secondo me, ...',
        },
        tip: 'Una postura clara en una frase.',
      },
      {
        label: 'Razón',
        template: {
          english: 'The main reason is ...',
          italian: 'Il motivo principale è ...',
        },
        tip: 'Explica el porqué, no repitas la opinión.',
      },
      {
        label: 'Ejemplo',
        template: {
          english: 'For example, ...',
          italian: 'Per esempio, ...',
        },
        tip: 'Un caso concreto de tu vida o de las noticias.',
      },
      {
        label: 'Cierre',
        template: {
          english: 'So, overall, ...',
          italian: 'Quindi, nel complesso, ...',
        },
        tip: 'Vuelve a tu punto con otras palabras.',
      },
    ],
    phrases: {
      english: ['I’d say that...', 'It depends on...', 'On the one hand... on the other hand...', 'That’s why I think...'],
      italian: ['Direi che...', 'Dipende da...', 'Da un lato... dall’altro...', 'Ecco perché penso che...'],
    },
    example: {
      english:
        "In my opinion, learning a language with an AI tutor is useful because you can practice without fear. The main reason is that you can make mistakes in private and repeat as many times as you want. For example, I practice speaking for ten minutes every morning. So, overall, I think it’s a great complement to real conversations.",
      italian:
        "Secondo me, imparare una lingua con un tutor AI è utile perché puoi esercitarti senza paura. Il motivo principale è che puoi sbagliare in privato e ripetere tutte le volte che vuoi. Per esempio, io pratico lo speaking dieci minuti ogni mattina. Quindi, nel complesso, penso che sia un ottimo complemento alle conversazioni reali.",
    },
    exampleEs:
      'En mi opinión, aprender un idioma con un tutor de IA es útil porque puedes practicar sin miedo. La razón principal es que puedes equivocarte en privado y repetir tantas veces como quieras. Por ejemplo, yo practico speaking diez minutos cada mañana. Así que, en general, creo que es un gran complemento a las conversaciones reales.',
  },
  {
    id: 'compare-options',
    category: 'opinion',
    question: {
      english: 'Which is better: ... or ...?',
      italian: 'Qual è meglio: ... o ...?',
    },
    questionEs: '¿Qué es mejor: ... o ...?',
    goal: 'Comparar con equilibrio: una semejanza, dos diferencias y una conclusión personal.',
    steps: [
      {
        label: 'Semejanza',
        template: {
          english: 'Both ... and ...',
          italian: 'Sia ... che ...',
        },
        tip: 'Empieza por lo que comparten.',
      },
      {
        label: 'Diferencia 1',
        template: {
          english: 'The main difference is ...',
          italian: 'La differenza principale è ...',
        },
        tip: 'Una diferencia objetiva: precio, tiempo, comodidad...',
      },
      {
        label: 'Diferencia 2',
        template: {
          english: 'While ..., ...',
          italian: 'Mentre ..., ...',
        },
        tip: 'Contrasta con "while" o "however".',
      },
      {
        label: 'Conclusión',
        template: {
          english: 'Personally, I prefer ... because ...',
          italian: 'Personalmente, preferisco ... perché ...',
        },
        tip: 'Elige uno y justifica. No hace falta ser neutral.',
      },
    ],
    phrases: {
      english: ['They have a lot in common...', 'However,...', 'It depends on what you need...', 'For me, the winner is...'],
      italian: ['Hanno molto in comune...', 'Tuttavia,...', 'Dipende da ciò che ti serve...', 'Per me, il migliore è...'],
    },
    example: {
      english:
        "Both studying alone and studying with a teacher help you learn. The main difference is feedback: a teacher corrects you immediately, while an app lets you repeat without pressure. However, apps are cheaper and more flexible. Personally, I prefer a mix because I need both feedback and daily practice.",
      italian:
        "Sia studiare da solo che studiare con un insegnante ti aiutano a imparare. La differenza principale è il feedback: un insegnante ti corregge subito, mentre un'app ti permette di ripetere senza pressione. Tuttavia, le app sono più economiche e flessibili. Personalmente, preferisco un mix perché ho bisogno sia di feedback sia di pratica quotidiana.",
    },
    exampleEs:
      'Tanto estudiar solo como estudiar con un profesor te ayudan a aprender. La diferencia principal es el feedback: un profesor te corrige de inmediato, mientras que una app te permite repetir sin presión. Sin embargo, las apps son más baratas y flexibles. Personalmente, prefiero una mezcla porque necesito tanto feedback como práctica diaria.',
  },
  {
    id: 'doctor-symptoms',
    category: 'servicio',
    question: {
      english: 'What seems to be the problem?',
      italian: 'Che cosa si sente?',
    },
    questionEs: '¿Qué le pasa? (en el médico)',
    goal: 'Describir síntoma, duración, gravedad y hacer una pregunta. Claro y sin rodeos.',
    steps: [
      {
        label: 'Síntoma',
        template: {
          english: 'I have a ... / My ... hurts.',
          italian: 'Ho ... / Mi fa male ...',
        },
        tip: 'Di el síntoma principal primero.',
      },
      {
        label: 'Duración',
        template: {
          english: 'It started ... ago.',
          italian: 'È iniziato ... fa.',
        },
        tip: 'Hace dos días, desde ayer, desde el lunes...',
      },
      {
        label: 'Gravedad',
        template: {
          english: 'It hurts when I ...',
          italian: 'Mi fa male quando ...',
        },
        tip: 'Explica cuándo empeora y del 1 al 10 cuánto duele.',
      },
      {
        label: 'Pregunta',
        template: {
          english: 'Should I ...? / Do I need to ...?',
          italian: 'Dovrei ...? / Devo ...?',
        },
        tip: 'Pregunta por el tratamiento o si necesitas algo.',
      },
    ],
    phrases: {
      english: ['I’ve had a headache since...', 'I’m allergic to...', 'It’s getting worse...', 'Is it serious?'],
      italian: ['Ho mal di testa da...', 'Sono allergico a...', 'Sta peggiorando...', 'È grave?'],
    },
    example: {
      english:
        "I have a sore throat and a headache. It started two days ago and it hurts when I swallow. It's getting worse at night. Should I take anything, or do I need to come back for a test?",
      italian:
        "Ho mal di gola e mal di testa. È iniziato due giorni fa e mi fa male quando deglutisco. Peggiora la sera. Dovrei prendere qualcosa o devo tornare per un test?",
    },
    exampleEs:
      'Tengo dolor de garganta y de cabeza. Empezó hace dos días y me duele al tragar. Empeora por la noche. ¿Debería tomar algo o necesito volver para un análisis?',
  },
  {
    id: 'complaint-service',
    category: 'servicio',
    question: {
      english: 'I’m afraid there’s a problem with your order.',
      italian: 'Mi dispiace, c’è un problema con il suo ordine.',
    },
    questionEs: 'Me temo que hay un problema con tu pedido.',
    goal: 'Resolver un problema con calma: explica, pide y agradece. Sin sonar agresivo.',
    steps: [
      {
        label: 'Situación',
        template: {
          english: "I'm afraid there's a problem with ...",
          italian: 'Mi dispiace, c’è un problema con ...',
        },
        tip: 'Di qué compraste y cuándo.',
      },
      {
        label: 'Problema',
        template: {
          english: 'I ordered ... but ...',
          italian: 'Ho ordinato ... ma ...',
        },
        tip: 'Explica la diferencia entre lo esperado y lo recibido.',
      },
      {
        label: 'Petición',
        template: {
          english: 'Could you ...?',
          italian: 'Potrebbe ...?',
        },
        tip: 'Pide una solución concreta: cambio, reembolso, arreglo.',
      },
      {
        label: 'Cierre',
        template: {
          english: 'Thank you for your help.',
          italian: 'Grazie per il suo aiuto.',
        },
        tip: 'Termina con educación; facilita la solución.',
      },
    ],
    phrases: {
      english: ['There seems to be a mistake...', 'Would it be possible to...?', 'I’d like a refund...', 'I appreciate your help.'],
      italian: ['Sembra esserci un errore...', 'Sarebbe possibile...?', 'Vorrei un rimborso...', 'Apprezzo il suo aiuto.'],
    },
    example: {
      english:
        "I'm afraid there's a problem with my order. I ordered a medium pizza but I received a small one. Could you send the right size or give me a refund? Thank you for your help.",
      italian:
        "Mi dispiace, c’è un problema con il mio ordine. Ho ordinato una pizza media ma ne ho ricevuta una piccola. Potrebbe mandare la misura giusta o darmi un rimborso? Grazie per il suo aiuto.",
    },
    exampleEs:
      'Me temo que hay un problema con mi pedido. Pedí una pizza mediana pero recibí una pequeña. ¿Podría enviar el tamaño correcto o darme un reembolso? Gracias por su ayuda.',
  },
  {
    id: 'small-talk',
    category: 'dia',
    question: {
      english: 'Nice to meet you! What do you do?',
      italian: 'Piacere! Cosa fai?',
    },
    questionEs: '¡Encantado! ¿A qué te dedicas?',
    goal: 'Responder, añadir un detalle y devolver la pregunta. La regla AAA: Answer, Add, Ask.',
    steps: [
      {
        label: 'Respuesta',
        template: {
          english: "I'm ... and I ...",
          italian: 'Sono ... e ...',
        },
        tip: 'Contesta directamente, sin rodeos.',
      },
      {
        label: 'Detalle',
        template: {
          english: "I've been ... recently / I really enjoy ...",
          italian: 'Ultimamente ... / Mi piace molto ...',
        },
        tip: 'Algo que dé pie a seguir hablando.',
      },
      {
        label: 'Devolver',
        template: {
          english: 'How about you? What do you do?',
          italian: 'E tu? Cosa fai?',
        },
        tip: 'Devuelve siempre la pregunta.',
      },
    ],
    phrases: {
      english: ['Nice to meet you too!', 'I work as...', 'I’m studying...', 'How about you?'],
      italian: ['Piacere mio!', 'Lavoro come...', 'Sto studiando...', 'E tu?'],
    },
    example: {
      english:
        "Nice to meet you! I'm Daniel and I work as a developer. I've been building apps for a small startup recently, which is challenging but fun. How about you? What do you do?",
      italian:
        "Piacere! Sono Daniel e lavoro come sviluppatore. Ultimamente costruisco app per una piccola startup, è impegnativo ma divertente. E tu? Cosa fai?",
    },
    exampleEs:
      '¡Encantado! Soy Daniel y trabajo como desarrollador. Últimamente estoy creando apps para una startup pequeña, es un reto pero divertido. ¿Y tú? ¿A qué te dedicas?',
  },
  {
    id: 'future-plans',
    category: 'dia',
    question: {
      english: 'What are your plans for the future?',
      italian: 'Quali sono i tuoi progetti per il futuro?',
    },
    questionEs: '¿Cuáles son tus planes para el futuro?',
    goal: 'Hablar de planes con "going to" / "futuro semplice", separando corto y largo plazo.',
    steps: [
      {
        label: 'Corto plazo',
        template: {
          english: "In the next few months, I'm going to ...",
          italian: 'Nei prossimi mesi, ho intenzione di ...',
        },
        tip: 'Un plan concreto y realista.',
      },
      {
        label: 'Largo plazo',
        template: {
          english: 'In a few years, I’d like to ...',
          italian: 'Tra qualche anno, mi piacerebbe ...',
        },
        tip: 'Un objetivo más grande, sin ser irreal.',
      },
      {
        label: 'Razón',
        template: {
          english: 'I want this because ...',
          italian: 'Lo voglio perché ...',
        },
        tip: 'Conecta el plan con un valor personal.',
      },
      {
        label: 'Devolver',
        template: {
          english: 'What about you? Any plans?',
          italian: 'E tu? Hai progetti?',
        },
        tip: 'Mantén la conversación viva.',
      },
    ],
    phrases: {
      english: ['I’m planning to...', 'I hope to...', 'My main goal is...', 'If everything goes well,...'],
      italian: ['Ho in programma di...', 'Spero di...', 'Il mio obiettivo principale è...', 'Se tutto va bene,...'],
    },
    example: {
      english:
        "In the next few months, I'm going to improve my English for work. In a few years, I'd like to work abroad for a while. I want this because I love learning from different cultures. What about you? Any plans?",
      italian:
        "Nei prossimi mesi, ho intenzione di migliorare il mio inglese per il lavoro. Tra qualche anno, mi piacerebbe lavorare all'estero per un po'. Lo voglio perché amo imparare da culture diverse. E tu? Hai progetti?",
    },
    exampleEs:
      'En los próximos meses, voy a mejorar mi inglés para el trabajo. En unos años, me gustaría trabajar en el extranjero un tiempo. Quiero esto porque me encanta aprender de culturas diferentes. ¿Y tú? ¿Tienes planes?',
  },
  {
    id: 'problem-solving',
    category: 'servicio',
    question: {
      english: 'We have a problem. Can you help?',
      italian: 'Abbiamo un problema. Puoi aiutarci?',
    },
    questionEs: 'Tenemos un problema. ¿Puedes ayudar?',
    goal: 'Pedir ayuda, explicar el problema, proponer una solución y confirmar el siguiente paso.',
    steps: [
      {
        label: 'Abrir',
        template: {
          english: "I need some help with ...",
          italian: 'Ho bisogno di aiuto con ...',
        },
        tip: 'Sé directo pero educado.',
      },
      {
        label: 'Problema',
        template: {
          english: "The problem is that ...",
          italian: 'Il problema è che ...',
        },
        tip: 'Una frase con el hecho principal.',
      },
      {
        label: 'Propuesta',
        template: {
          english: 'We could ... if that works for you.',
          italian: 'Potremmo ... se per te va bene.',
        },
        tip: 'Propón una solución, no solo describas el problema.',
      },
      {
        label: 'Confirmar',
        template: {
          english: 'Does that sound good? / Shall we ...?',
          italian: 'Ti sembra giusto? / Facciamo ...?',
        },
        tip: 'Cierra con una pregunta para confirmar.',
      },
    ],
    phrases: {
      english: ['Could you give me a hand?', 'What do you suggest?', 'Let’s try...', 'I’ll take care of...'],
      italian: ['Puoi darmi una mano?', 'Cosa suggerisci?', 'Proviamo a...', 'Me ne occupo io...'],
    },
    example: {
      english:
        "I need some help with the presentation. The problem is that two slides are missing data. We could split the work: I'll finish the charts and you check the numbers, if that works for you. Does that sound good?",
      italian:
        "Ho bisogno di aiuto con la presentazione. Il problema è che mancano i dati in due slide. Potremmo dividerci il lavoro: io finisco i grafici e tu controlli i numeri, se per te va bene. Ti sembra giusto?",
    },
    exampleEs:
      'Necesito ayuda con la presentación. El problema es que faltan datos en dos diapositivas. Podríamos dividir el trabajo: yo termino los gráficos y tú revisas los números, si te parece bien. ¿Te suena bien?',
  },
];

/** Estructura genérica para preguntas que no están en la lista. */
export function structureFallback(question: string, language: Language): SpeakingStructure {
  const target = language === 'italian' ? 'italian' : 'english';
  return {
    id: `fallback-${Date.now()}`,
    category: 'personalizada',
    question: { english: question, italian: question },
    questionEs: question,
    goal: 'Responde con una idea clara, una razón, un ejemplo y un cierre. Luego devuelve la pregunta.',
    steps: [
      {
        label: 'Respuesta',
        template: {
          english: 'I think ... / In my case, ...',
          italian: 'Penso che ... / Nel mio caso, ...',
        },
        tip: 'Contesta directamente en la primera frase.',
      },
      {
        label: 'Razón',
        template: {
          english: 'The main reason is ...',
          italian: 'Il motivo principale è ...',
        },
        tip: 'Explica por qué, sin repetir la respuesta.',
      },
      {
        label: 'Ejemplo',
        template: {
          english: 'For example, ...',
          italian: 'Per esempio, ...',
        },
        tip: 'Un caso concreto y breve.',
      },
      {
        label: 'Cierre',
        template: {
          english: 'So, overall, ... What about you?',
          italian: 'Quindi, nel complesso, ... E tu?',
        },
        tip: 'Cierra y devuelve la pregunta para seguir hablando.',
      },
    ],
    phrases: {
      english: ['In my opinion...', 'For example...', 'That’s why...', 'What about you?'],
      italian: ['Secondo me...', 'Per esempio...', 'Ecco perché...', 'E tu?'],
    },
    example: {
      english: `In my case, ${question.replace(/[?.!]+$/, '')} is something I think about often. The main reason is that it affects my daily routine. For example, I try to plan my week and leave time for it. So, overall, I think it is worth it. What about you?`,
      italian: `Nel mio caso, ${question.replace(/[?.!]+$/, '')} è qualcosa a cui penso spesso. Il motivo principale è che influisce sulla mia routine quotidiana. Per esempio, cerco di pianificare la settimana e lasciare tempo per questo. Quindi, nel complesso, penso che ne valga la pena. E tu?`,
    },
    exampleEs:
      'En mi caso, es algo en lo que pienso a menudo. La razón principal es que afecta mi rutina diaria. Por ejemplo, intento planificar la semana y dejar tiempo para ello. Así que, en general, creo que vale la pena. ¿Y tú?',
    custom: true,
  };
}
