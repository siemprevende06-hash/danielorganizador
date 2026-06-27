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

export function emojiList(): string[] {
  return [
    '📄', '📝', '📋', '📌', '📎', '🎯', '💡', '🚀', '⭐', '🔥',
    '💪', '🧠', '🎵', '📖', '🎨', '🏆', '💻', '📊', '🗂️', '📁',
    '🎉', '✅', '🔄', '📅', '📈', '🏠', '💼', '🎓', '❤️', '👀',
  ]
}
