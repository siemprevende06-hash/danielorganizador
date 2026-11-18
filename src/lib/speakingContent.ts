import type { Language } from '@/hooks/useLanguageLearning';
import type { SpeakingLevel } from './speakingMetrics';

// ---------------------------------------------------------------------------
// Contenido curado del entrenador de pronunciación (M1)
//
// Frases cortas, evaluables sin LLM y ordenadas por nivel. Los pares mínimos
// italianos atacan los tres puntos que más cuesta distinguir a un hispanohablante:
// "gli", las consonantes dobles y la pareja é/è.
// ---------------------------------------------------------------------------

export interface PronunciationPhrase {
  text: string;
  translation: string;
  focus: string;
}

export const PRONUNCIATION_PHRASES: Record<
  Language,
  Record<SpeakingLevel, PronunciationPhrase[]>
> = {
  english: {
    A2: [
      { text: 'I usually have breakfast at seven.', translation: 'Normalmente desayuno a las siete.', focus: 'Ritmo y sonido /z/' },
      { text: 'She works in a small office near the station.', translation: 'Ella trabaja en una oficina pequeña cerca de la estación.', focus: 'Tercera persona -s' },
      { text: 'Can I have a glass of water, please?', translation: '¿Me puedes dar un vaso de agua, por favor?', focus: 'Vocal /æ/ y petición educada' },
      { text: 'I went to the beach last weekend.', translation: 'Fui a la playa el fin de semana pasado.', focus: 'Pasado irregular' },
      { text: 'There are three books on the table.', translation: 'Hay tres libros sobre la mesa.', focus: '/θ/ de three y there' },
    ],
    B1: [
      { text: 'I have been learning English for about three years.', translation: 'Llevo unos tres años aprendiendo inglés.', focus: 'Present perfect continuous' },
      { text: 'If I had more time, I would travel around Europe.', translation: 'Si tuviera más tiempo, viajaría por Europa.', focus: 'Condicional y enlaces' },
      { text: 'The project was finished before the deadline.', translation: 'El proyecto se terminó antes de la fecha límite.', focus: 'Ritmo de sílabas átonas' },
      { text: 'I am looking forward to hearing from you.', translation: 'Espero tener noticias tuyas.', focus: 'Expresión fija y /h/ muda' },
      { text: 'Could you tell me how to get to the airport?', translation: '¿Podrías decirme cómo llegar al aeropuerto?', focus: 'Entonación de pregunta indirecta' },
    ],
    B2: [
      { text: 'The decision was made after a thorough discussion.', translation: 'La decisión se tomó tras una discusión a fondo.', focus: '/θ/ y vocales largas' },
      { text: 'I would have handled the situation differently.', translation: 'Habría manejado la situación de otra forma.', focus: 'Third conditional' },
      { text: 'Despite the setbacks, the team managed to deliver on time.', translation: 'A pesar de los contratiempos, el equipo logró entregar a tiempo.', focus: 'Acento de frase' },
      { text: 'What really matters is how we respond to failure.', translation: 'Lo que de verdad importa es cómo respondemos al fracaso.', focus: 'Enlaces y consonantes finales' },
      { text: 'I am not entirely convinced by that argument.', translation: 'No me convence del todo ese argumento.', focus: 'Entonación de matices' },
    ],
  },
  italian: {
    A2: [
      { text: 'Vorrei un caffè e un bicchiere d’acqua.', translation: 'Querría un café y un vaso de agua.', focus: 'Consonantes dobles' },
      { text: 'Abito vicino alla stazione.', translation: 'Vivo cerca de la estación.', focus: 'Acento y vocales abiertas' },
      { text: 'Oggi è una bella giornata.', translation: 'Hoy es un día bonito.', focus: 'è abierta' },
      { text: 'Mi piace leggere la sera.', translation: 'Me gusta leer por la noche.', focus: 'GLI y ritmo' },
      { text: 'Quanto costa questo biglietto?', translation: '¿Cuánto cuesta este billete?', focus: 'Entonación de pregunta' },
    ],
    B1: [
      { text: 'Sono andato in Italia l’anno scorso.', translation: 'Fui a Italia el año pasado.', focus: 'Pasado y dobles' },
      { text: 'Mi piacerebbe provare un piatto tipico.', translation: 'Me gustaría probar un plato típico.', focus: 'GLI y condicional' },
      { text: 'Penso che sia importante parlare ogni giorno.', translation: 'Creo que es importante hablar cada día.', focus: 'Subjuntivo y enlaces' },
      { text: 'Potresti ripetere più lentamente, per favore?', translation: '¿Podrías repetirlo más despacio, por favor?', focus: 'Doppie y petición' },
      { text: 'La riunione è stata rimandata a domani.', translation: 'La reunión se ha aplazado a mañana.', focus: 'Consonantes dobles' },
    ],
    B2: [
      { text: 'Nonostante le difficoltà, siamo riusciti a finire in tempo.', translation: 'A pesar de las dificultades, logramos terminar a tiempo.', focus: 'Acento de frase' },
      { text: 'Se avessi saputo prima, avrei agito diversamente.', translation: 'Si lo hubiera sabido antes, habría actuado de otra forma.', focus: 'Condicional compuesto' },
      { text: 'È fondamentale ascoltare il punto di vista degli altri.', translation: 'Es fundamental escuchar el punto de vista de los demás.', focus: 'GLI y diptongos' },
      { text: 'La situazione è più complessa di quanto sembri.', translation: 'La situación es más compleja de lo que parece.', focus: 'Acento y è abierta' },
      { text: 'Vorrei approfondire questo argomento con calma.', translation: 'Me gustaría profundizar en este tema con calma.', focus: 'Doppie y ritmo' },
    ],
  },
};

export interface MinimalPair {
  a: string;
  b: string;
  hint: string;
}

export const MINIMAL_PAIRS: Record<Language, MinimalPair[]> = {
  italian: [
    { a: 'gli', b: 'li', hint: 'GLI suena como la "ll" argentina; LI es una L seguida de i.' },
    { a: 'aglio', b: 'allio', hint: 'Ajo (aglio) lleva GLI; allio no existe: separa la L.' },
    { a: 'figlio', b: 'filo', hint: 'Hijo (figlio) frente a hilo (filo).' },
    { a: 'maglia', b: 'malia', hint: 'Camiseta (maglia) frente a hechizo (malia).' },
    { a: 'anno', b: 'ano', hint: 'Año (anno) con doble N frente a ano.' },
    { a: 'casa', b: 'cassa', hint: 'Casa frente a caja: la doble S se alarga.' },
    { a: 'pala', b: 'palla', hint: 'Pala frente a pelota: doble L.' },
    { a: 'fato', b: 'fatto', hint: 'Destino frente a hecho: doble T.' },
    { a: 'perché', b: 'perche', hint: 'Por qué (é cerrada) frente a perchas.' },
    { a: 'sé', b: 'se', hint: 'Sé (sabe) con é cerrada frente a si (se).' },
  ],
  english: [
    { a: 'ship', b: 'sheep', hint: '/ɪ/ corta frente a /iː/ larga.' },
    { a: 'live', b: 'leave', hint: 'Vivir frente a marcharse: vocal corta/larga.' },
    { a: 'think', b: 'sink', hint: '/θ/ frente a /s/.' },
    { a: 'work', b: 'walk', hint: '/ɜː/ frente a /ɔː/.' },
    { a: 'beach', b: 'bitch', hint: 'Vocal larga frente a corta; cuidado con el tabú.' },
  ],
};

/** Escenario recomendado para una banda CEFR (U11). */
export function recommendedScenarioIndex(level: SpeakingLevel): number {
  if (level === 'A2') return 0;
  if (level === 'B1') return 3;
  return 7;
}
