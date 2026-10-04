export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'todo'
  | 'bullet_list'
  | 'numbered_list'
  | 'quote'
  | 'divider'
  | 'code'

export interface Block {
  id: string
  type: BlockType
  content: string
  checked?: boolean
  language?: string
}

export interface PageMeta {
  id: string
  title: string
  icon: string
  is_favorite: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export function generateId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11)
}

const META_KEY = 'pages_meta'

export function getPagesMeta(): PageMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePagesMeta(meta: PageMeta[]): void {
  localStorage.setItem(META_KEY, JSON.stringify(meta))
}

export function getPageContent(id: string): Block[] {
  try {
    const raw = localStorage.getItem(`page_content_${id}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePageContent(id: string, blocks: Block[]): void {
  localStorage.setItem(`page_content_${id}`, JSON.stringify(blocks))
}

export function removePageContent(id: string): void {
  localStorage.removeItem(`page_content_${id}`)
}

export function createPageMeta(overrides?: Partial<PageMeta>): PageMeta {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    title: 'Sin título',
    icon: '📄',
    is_favorite: false,
    sort_order: Date.now(),
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

export interface EmojiCategory {
  name: string
  emojis: string[]
  /** Terminos buscables por emoji. El buscador del picker no puede usar el glifo. */
  keywords: Record<string, string[]>
}

export function emojiCategories(): EmojiCategory[] {
  return [
    {
      name: 'Frecuentes',
      emojis: ['📄', '📝', '📋', '📌', '📎', '🎯', '💡', '🚀', '⭐', '🔥'],
      keywords: {
        '📄': ['documento', 'pagina', 'archivo', 'document', 'page', 'file'],
        '📝': ['nota', 'escribir', 'editar', 'memo', 'note', 'write', 'edit'],
        '📋': ['lista', 'checklist', 'tareas', 'list', 'clipboard'],
        '📌': ['pin', 'fijar', 'importante', 'pin', 'pushpin'],
        '📎': ['clip', 'adjunto', 'paperclip', 'adjunto', 'atachar'],
        '🎯': ['objetivo', 'meta', 'diana', 'target', 'goal', 'aim'],
        '💡': ['idea', 'idea', 'consejo', 'tip', 'bulb', 'insight'],
        '🚀': ['rocket', 'lanzar', 'emprendimiento', 'launch', 'startup', 'ship'],
        '⭐': ['estrella', 'favorito', 'destacado', 'star', 'favorite'],
        '🔥': ['fuego', 'calor', 'urgente', 'fire', 'hot', 'flame', 'trend'],
      },
    },
    {
      name: 'Objetos',
      emojis: ['💼', '📁', '🗂️', '📊', '📈', '📉', '📅', '📆', '🗒️', '🗓️'],
      keywords: {
        '💼': ['maleta', 'bolso', 'trabajo', 'negocios', 'briefcase', 'work', 'business'],
        '📁': ['carpeta', 'directorio', 'folder', 'directory'],
        '🗂️': ['organizador', 'tarjetas', 'index', 'cards', 'organizer'],
        '📊': ['grafico', 'datos', 'analisis', 'chart', 'data', 'analytics', 'stats'],
        '📈': ['subir', 'crecer', 'ganancia', 'growth', 'up', 'profit'],
        '📉': ['bajar', 'decrecer', 'perdida', 'down', 'loss', 'decline'],
        '📅': ['calendario', 'fecha', 'dia', 'calendar', 'date', 'schedule'],
        '📆': ['agenda', 'plan', 'calendar', 'planner'],
        '🗒️': ['notepad', 'paderno', 'notas', 'notebook', 'memo'],
        '🗓️': ['agenda', 'calendario', 'planificador', 'planner', 'schedule'],
      },
    },
    {
      name: 'Actividades',
      emojis: ['💪', '🧠', '🎵', '📖', '🎨', '🏆', '💻', '🎮', '🏋️', '🏃'],
      keywords: {
        '💪': ['gym', 'fuerza', 'musculo', 'entrenamiento', 'strength', 'workout', 'fitness'],
        '🧠': ['mente', 'cerebro', 'aprender', 'inteligencia', 'brain', 'mind', 'learn'],
        '🎵': ['musica', 'cancion', 'piano', 'guitarra', 'audio', 'music', 'song', 'audio'],
        '📖': ['leer', 'libro', 'estudio', 'lectura', 'read', 'book', 'study', 'reading'],
        '🎨': ['arte', 'diseño', 'crear', 'pintura', 'art', 'design', 'paint', 'create'],
        '🏆': ['trofeo', 'premio', 'logro', 'meta', 'trophy', 'award', 'win', 'goal'],
        '💻': ['codigo', 'programar', 'computadora', 'tech', 'code', 'dev', 'laptop', 'program'],
        '🎮': ['juego', 'gamer', 'videojuego', 'game', 'gaming', 'play'],
        '🏋️': ['gimnasio', 'levantamiento', 'entrenar', 'weight', 'lift', 'gym', 'workout'],
        '🏃': ['correr', 'deporte', 'carrera', 'run', 'sport', 'running', 'jog'],
      },
    },
    {
      name: 'Simbolos',
      emojis: ['✅', '❌', '🔄', '⏳', '🔔', '💎', '🔑', '📌', '🏷️', '🔖'],
      keywords: {
        '✅': ['check', 'listo', 'hecho', 'ok', 'done', 'completado', 'valid'],
        '❌': ['error', 'no', 'mal', 'fallo', 'x', 'fail', 'wrong'],
        '🔄': ['repetir', 'cambio', 'sincronizar', 'reload', 'sync', 'refresh', 'loop'],
        '⏳': ['tiempo', 'espera', 'reloj', 'hourglass', 'time', 'wait', 'loading'],
        '🔔': ['alerta', 'aviso', 'notificacion', 'bell', 'alert', 'notification'],
        '💎': ['diamante', 'precio', 'valor', 'diamond', 'gem', 'value', 'premium'],
        '🔑': ['llave', 'clave', 'acceso', 'key', 'access', 'password'],
        '📌': ['pin', 'fijar', 'importante', 'pin', 'pushpin', 'important'],
        '🏷️': ['etiqueta', 'precio', 'tag', 'label', 'price'],
        '🔖': ['marcador', 'favorito', 'bookmark', 'save'],
      },
    },
    {
      name: 'Caras',
      emojis: ['😀', '😎', '🤩', '🥳', '😏', '🤔', '😴', '🤗', '👀', '❤️'],
      keywords: {
        '😀': ['sonrisa', 'feliz', 'smile', 'happy', 'joy'],
        '😎': ['gafas', 'relajado', 'cool', 'sunglasses', 'chill'],
        '🤩': ['estrellado', 'emocionado', 'starstruck', 'excited'],
        '🥳': ['fiesta', 'celebrar', 'party', 'celebrate'],
        '😏': ['guiño', 'divertido', 'wink', 'fun', 'playful'],
        '🤔': ['pensar', 'duda', 'idea', 'think', 'doubt', 'hmm'],
        '😴': ['dormir', 'cansado', 'sueno', 'sleep', 'tired', 'rest'],
        '🤗': ['abrazo', 'amistad', 'hug', 'friend', 'welcome'],
        '👀': ['ojos', 'mirar', 'vigilando', 'eyes', 'look', 'watch', 'review'],
        '❤️': ['corazon', 'amor', 'gustar', 'heart', 'love', 'like', 'favorite'],
      },
    },
    {
      name: 'Naturaleza',
      emojis: ['🌟', '🌙', '☀️', '🌈', '🔥', '💧', '🌿', '🌸', '🌺', '🍀'],
      keywords: {
        '🌟': ['estrella', 'brillo', 'destello', 'star', 'shine', 'sparkle'],
        '🌙': ['luna', 'noche', 'moon', 'night', 'sleep'],
        '☀️': ['sol', 'dia', 'claro', 'sun', 'day', 'sunny', 'weather'],
        '🌈': ['arcoiris', 'colores', 'rainbow', 'colorful'],
        '🔥': ['fuego', 'llama', 'calor', 'fire', 'flame', 'hot', 'burn'],
        '💧': ['agua', 'gota', 'hidratacion', 'water', 'drop', 'liquid', 'hydration'],
        '🌿': ['planta', 'naturealeza', 'salud', 'plant', 'nature', 'leaf', 'health'],
        '🌸': ['flor', 'primavera', 'cereza', 'flower', 'spring', 'cherry'],
        '🌺': ['flor', 'tropical', 'hibisco', 'flower', 'tropical', 'bloom'],
        '🍀': ['trebol', 'suerte', 'clover', 'luck', 'lucky'],
      },
    },
    {
      name: 'Colores',
      emojis: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '💖'],
      keywords: {
        '🔴': ['rojo', 'red', 'error', 'danger', 'urgent'],
        '🟠': ['naranja', 'orange', 'warning', 'aviso'],
        '🟡': ['amarillo', 'yellow', 'caution', 'cuidado', 'pending'],
        '🟢': ['verde', 'green', 'ok', 'success', 'done', 'listo'],
        '🔵': ['azul', 'blue', 'info', 'information'],
        '🟣': ['morado', 'violeta', 'purple', 'violet'],
        '⚫': ['negro', 'black', 'dark', 'oscuro'],
        '⚪': ['blanco', 'white', 'light', 'claro', 'neutral'],
        '🟤': ['marron', 'brown', 'tierra', 'earth'],
        '💖': ['rosa', 'amor', 'pink', 'love', 'heart'],
      },
    },
  ]
}

export function emojiList(): string[] {
  return emojiCategories().flatMap(cat => cat.emojis)
}
