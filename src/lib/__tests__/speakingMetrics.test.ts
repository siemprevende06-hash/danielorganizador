import { describe, expect, it } from 'vitest';
import {
  compararPronunciacion,
  computeSpeakingMetrics,
  contarMuletillas,
  formatWpm,
  hashTexto,
  inferErrorCategory,
  levelBand,
  levelDistance,
  levenshtein,
  normalizarTexto,
  palabras,
  parseSummaryErrors,
  similitudPalabra,
} from '@/lib/speakingMetrics';

describe('normalizarTexto', () => {
  it('quita mayúsculas, tildes y puntuación', () => {
    expect(normalizarTexto('¿Qué tal, señor? ¡Bien!')).toBe('que tal senor bien');
  });

  it('colapsa espacios y respeta apóstrofos como separador', () => {
    expect(normalizarTexto("  I'm   fine  ")).toBe('i m fine');
  });

  it('devuelve cadena vacía para texto vacío', () => {
    expect(normalizarTexto('')).toBe('');
    expect(palabras('   ')).toEqual([]);
  });
});

describe('levelBand / levelDistance', () => {
  it('reduce un nivel compuesto a su banda', () => {
    expect(levelBand('B1.2')).toBe('B1');
    expect(levelBand('A2')).toBe('A2');
    expect(levelBand('b2.1')).toBe('B2');
  });

  it('cae en B1 cuando el nivel no se reconoce o falta', () => {
    expect(levelBand('C1')).toBe('B1');
    expect(levelBand(null)).toBe('B1');
    expect(levelBand(undefined)).toBe('B1');
  });

  it('mide la distancia entre bandas', () => {
    expect(levelDistance('A2', 'A2')).toBe(0);
    expect(levelDistance('A2', 'B1')).toBe(1);
    expect(levelDistance('A2', 'B2')).toBe(2);
  });
});

describe('levenshtein / similitudPalabra', () => {
  it('calcula la distancia de edición mínima', () => {
    expect(levenshtein('casa', 'casa')).toBe(0);
    expect(levenshtein('casa', 'caza')).toBe(1);
    expect(levenshtein('', 'hola')).toBe(4);
    expect(levenshtein('hola', '')).toBe(4);
  });

  it('convierte la distancia en similitud 0..1', () => {
    expect(similitudPalabra('water', 'water')).toBe(1);
    expect(similitudPalabra('water', 'watter')).toBeCloseTo(1 - 1 / 6, 5);
    expect(similitudPalabra('', '')).toBe(1);
  });
});

describe('compararPronunciacion', () => {
  it('da 100% cuando se entiende la frase exacta', () => {
    const result = compararPronunciacion('I would like a coffee', 'i would like a coffee');
    expect(result.score).toBe(100);
    expect(result.correct).toBe(result.total);
    expect(result.words.every(word => word.ok)).toBe(true);
  });

  it('tolera una palabra mal oída sin hundir la frase', () => {
    const result = compararPronunciacion('I would like a coffee', 'I would like a coffe');
    expect(result.total).toBe(5);
    expect(result.score).toBe(100);
  });

  it('marca las palabras que faltan y suma lo que sobra sin penalizar', () => {
    const result = compararPronunciacion('I would like a coffee', 'I would like');
    expect(result.correct).toBe(3);
    expect(result.total).toBe(5);
    expect(result.score).toBe(60);
    expect(result.words.slice(3).every(word => !word.ok)).toBe(true);

    const extra = compararPronunciacion('hello', 'hello there friend');
    expect(extra.score).toBe(100);
  });

  it('devuelve 0 sin objetivo y propaga la confianza', () => {
    const result = compararPronunciacion('', 'algo', 0.8);
    expect(result).toMatchObject({ score: 0, total: 0, correct: 0, confidence: 0.8 });
  });

  it('no considera acertada una palabra muy distinta', () => {
    const result = compararPronunciacion('coffee', 'toffee', 0);
    expect(result.words[0].ok).toBe(true); // 1 letra de diferencia
    const lejos = compararPronunciacion('coffee', 'banana', 0);
    expect(lejos.words[0].ok).toBe(false);
    expect(lejos.score).toBe(0);
  });
});

describe('contarMuletillas', () => {
  it('cuenta muletillas en inglés sin repetir subcadenas', () => {
    expect(contarMuletillas('I was, um, like, you know, thinking', 'english')).toBe(3);
  });

  it('cuenta muletillas en italiano', () => {
    expect(contarMuletillas('Cioè, allora, tipo, non lo so', 'italian')).toBe(3);
  });

  it('devuelve 0 cuando no hay muletillas', () => {
    expect(contarMuletillas('I went to the market yesterday', 'english')).toBe(0);
  });
});

describe('computeSpeakingMetrics', () => {
  it('suma turnos, palabras, ritmo y aciertos', () => {
    const metrics = computeSpeakingMetrics({
      userTexts: ['hello there friend', 'how are you today', 'um I am fine'],
      feedback: {
        u1: { status: 'correcto' },
        u2: { status: 'incorrecto', corrected: 'How are you today?' },
        u3: { status: 'correcto' },
      },
      userMessageIds: ['u1', 'u2', 'u3'],
      language: 'english',
      durationMs: 60_000,
    });

    expect(metrics.turns).toBe(3);
    expect(metrics.words).toBe(11);
    expect(metrics.wpm).toBe(11);
    expect(metrics.avgWordsPerTurn).toBe(4);
    expect(metrics.correct).toBe(2);
    expect(metrics.incorrect).toBe(1);
    expect(metrics.evaluated).toBe(3);
    expect(metrics.correctPct).toBe(67);
    expect(metrics.fillers).toBe(1);
    expect(metrics.durationMinutes).toBe(1);
  });

  it('devuelve correctPct null cuando no hay evaluaciones', () => {
    const metrics = computeSpeakingMetrics({
      userTexts: ['hola'],
      feedback: {},
      userMessageIds: ['u1'],
      language: 'italian',
      durationMs: 0,
    });
    expect(metrics.correctPct).toBeNull();
    expect(metrics.evaluated).toBe(0);
    expect(metrics.wpm).toBe(0);
  });

  it('ignora feedback de ids que no son de la sesión', () => {
    const metrics = computeSpeakingMetrics({
      userTexts: ['one'],
      feedback: { viejo: { status: 'correcto' } },
      userMessageIds: ['nuevo'],
      language: 'english',
      durationMs: 30_000,
    });
    expect(metrics.evaluated).toBe(0);
  });
});

describe('parseSummaryErrors', () => {
  it('extrae líneas con ✗ y →', () => {
    const markdown = [
      '## Resumen',
      '- ✗ I have went to Rome → ✓ I went to Rome → pasado simple',
      '* ✗ "I am agree" → ✓ "I agree" → no se dice «am agree»',
      'Esta línea no tiene formato',
    ].join('\n');

    expect(parseSummaryErrors(markdown)).toEqual([
      { wrong: 'I have went to Rome', correct: 'I went to Rome', note: 'pasado simple' },
      { wrong: 'I am agree', correct: 'I agree', note: 'no se dice «am agree»' },
    ]);
  });

  it('ignora líneas sin flecha y errores vacíos', () => {
    expect(parseSummaryErrors('✗ sin flecha\n→ ✓ nada\n✗ → ✓')).toEqual([]);
  });

  it('deduplica por frase errónea y corta a 6', () => {
    const lines = Array.from({ length: 9 }, (_, index) => `✗ fallo ${index} → ✓ acierto ${index} → nota`);
    lines.push('✗ fallo 0 → ✓ otra → repetido');
    const result = parseSummaryErrors(lines.join('\n'));
    expect(result).toHaveLength(6);
    expect(result.filter(item => item.wrong === 'fallo 0')).toHaveLength(1);
  });

  it('no lanza con texto vacío', () => {
    expect(parseSummaryErrors('')).toEqual([]);
  });
});

describe('inferErrorCategory', () => {
  it('reconoce pronunciación, vocabulario y gramática', () => {
    expect(inferErrorCategory('La pronunciación de "th" suena a "t"')).toBe('pronunciacion');
    expect(inferErrorCategory('Esa palabra significa otra cosa')).toBe('vocabulario');
    expect(inferErrorCategory('Falta el auxiliar en la pregunta')).toBe('gramatica');
  });

  it('reconoce ortografía y fluidez', () => {
    expect(inferErrorCategory('Revisa la tilde al escribir')).toBe('ortografia');
    expect(inferErrorCategory('Demasiado largo: mejor más corto y conciso')).toBe('fluidez');
  });
});

describe('hashTexto / formatWpm', () => {
  it('es estable e ignora tildes y mayúsculas', () => {
    expect(hashTexto('Hola, señor')).toBe(hashTexto('hola senor'));
    expect(hashTexto('hola')).not.toBe(hashTexto('adios'));
  });

  it('formatea el ritmo', () => {
    expect(formatWpm(120)).toBe('120 ppm');
    expect(formatWpm(0)).toBe('—');
  });
});
