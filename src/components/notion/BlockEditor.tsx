import { useState, useRef, useEffect, useCallback } from 'react'
import { type Block, type BlockType, generateId } from '@/lib/pages'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  ListOrdered,
  Quote,
  Minus,
  Code,
} from 'lucide-react'

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
}

const commands: { type: BlockType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'paragraph', label: 'Texto', icon: <Type className="h-4 w-4" />, description: 'Párrafo simple' },
  { type: 'heading1', label: 'Título 1', icon: <Heading1 className="h-4 w-4" />, description: 'Encabezado grande' },
  { type: 'heading2', label: 'Título 2', icon: <Heading2 className="h-4 w-4" />, description: 'Encabezado mediano' },
  { type: 'heading3', label: 'Título 3', icon: <Heading3 className="h-4 w-4" />, description: 'Encabezado pequeño' },
  { type: 'todo', label: 'Tarea', icon: <CheckSquare className="h-4 w-4" />, description: 'Lista de tareas' },
  { type: 'bullet_list', label: 'Lista viñetas', icon: <List className="h-4 w-4" />, description: 'Lista con bullets' },
  { type: 'numbered_list', label: 'Lista numerada', icon: <ListOrdered className="h-4 w-4" />, description: 'Lista numerada' },
  { type: 'quote', label: 'Cita', icon: <Quote className="h-4 w-4" />, description: 'Cita en bloque' },
  { type: 'divider', label: 'Divisor', icon: <Minus className="h-4 w-4" />, description: 'Línea divisoria' },
  { type: 'code', label: 'Código', icon: <Code className="h-4 w-4" />, description: 'Bloque de código' },
]

function placeholder(type: BlockType): string {
  switch (type) {
    case 'heading1': return 'Título 1'
    case 'heading2': return 'Título 2'
    case 'heading3': return 'Título 3'
    case 'todo': return 'Tarea pendiente...'
    case 'bullet_list': return 'Lista'
    case 'numbered_list': return 'Lista numerada'
    case 'quote': return 'Cita...'
    case 'code': return 'Escribe código...'
    default: return 'Escribe aquí...'
  }
}

function BlockRow({
  block,
  onUpdate,
  onDelete,
  onSplit,
  onArrow,
  autoFocus,
  onSlashOpen,
  slashOpen,
}: {
  block: Block
  onUpdate: (updates: Partial<Block>) => void
  onDelete: () => void
  onSplit: (before: string, after: string) => void
  onArrow: (dir: 'up' | 'down') => void
  autoFocus: boolean
  slashOpen: boolean
  onSlashOpen: (open: boolean) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [slashQuery, setSlashQuery] = useState('')

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus()
      moveCursorToEnd(ref.current)
    }
  }, [])

  useEffect(() => {
    if (!ref.current || document.activeElement === ref.current) return
    ref.current.innerText = block.content || ''
  }, [block.id])

  const handleInput = () => {
    const text = ref.current?.innerText || ''
    onUpdate({ content: text })
    if (text.startsWith('/')) {
      onSlashOpen(true)
      setSlashQuery(text.slice(1))
    } else {
      onSlashOpen(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    const el = ref.current
    if (!el) return

    if (slashOpen) {
      if (e.key === 'Escape') { onSlashOpen(false); if (ref.current) ref.current.innerText = '' }
      if (e.key === 'Enter') e.preventDefault()
      return
    }

    const text = el.innerText || ''
    const caret = caretOffset(el)

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const before = text.slice(0, caret)
      const after = text.slice(caret)
      onSplit(before, after)
      return
    }

    if (e.key === 'Backspace' && text === '') {
      e.preventDefault()
      onDelete()
      return
    }

    if (e.key === 'ArrowUp') { e.preventDefault(); onArrow('up') }
    if (e.key === 'ArrowDown') { e.preventDefault(); onArrow('down') }
  }

  const handleSlashSelect = (type: BlockType) => {
    onSlashOpen(false)
    if (type === 'divider') {
      onUpdate({ type: 'divider', content: '—————————————————' })
    } else {
      onUpdate({ type, content: '' })
    }
    setTimeout(() => { if (ref.current) { ref.current.innerText = ''; ref.current.focus() } }, 0)
  }

  if (block.type === 'divider') {
    return <div className="py-2"><div className="border-t border-border" /></div>
  }

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(slashQuery.toLowerCase())
  )

  return (
    <div className="relative group flex items-start gap-2 py-0.5">
      <div className="absolute -left-6 top-1 opacity-0 group-hover:opacity-40 text-muted-foreground cursor-grab text-xs">
        ⋮⋮
      </div>
      {block.type === 'todo' && (
        <Checkbox
          checked={block.checked || false}
          onCheckedChange={(v) => onUpdate({ checked: !!v })}
          className="mt-1.5"
        />
      )}
      {block.type === 'bullet_list' && (
        <span className="mt-1.5 text-muted-foreground select-none shrink-0 text-sm">•</span>
      )}
      {block.type === 'numbered_list' && (
        <span className="mt-1.5 text-muted-foreground select-none shrink-0 text-xs w-4 text-right">1.</span>
      )}
      {block.type === 'quote' && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-muted-foreground/20 rounded-full" />
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder(block.type)}
        className={cn(
          'outline-none w-full whitespace-pre-wrap break-words min-h-[1.5em] leading-relaxed',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40',
          block.type === 'heading1' && 'text-3xl font-bold',
          block.type === 'heading2' && 'text-2xl font-semibold',
          block.type === 'heading3' && 'text-xl font-medium',
          block.type === 'quote' && 'pl-4 italic text-muted-foreground',
          block.type === 'code' && 'font-mono text-sm bg-muted rounded-md p-2',
          block.checked && block.type === 'todo' && 'line-through text-muted-foreground/60',
        )}
        onInput={handleInput}
        onKeyDown={handleKey}
      />
      {slashOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border bg-popover shadow-lg p-1">
          <p className="px-2 py-1 text-xs text-muted-foreground">Comandos</p>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filtered.map(cmd => (
              <button
                key={cmd.type}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left"
                onClick={() => handleSlashSelect(cmd.type)}
              >
                <span className="text-muted-foreground">{cmd.icon}</span>
                <span className="font-medium">{cmd.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">{cmd.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [slashIdx, setSlashIdx] = useState<number | null>(null)

  const updateBlock = useCallback((idx: number, updates: Partial<Block>) => {
    const next = blocks.map((b, i) => i === idx ? { ...b, ...updates } : b)
    onChange(next)
  }, [blocks, onChange])

  const deleteBlock = useCallback((idx: number) => {
    if (blocks.length <= 1) {
      onChange([{ id: generateId(), type: 'paragraph', content: '' }])
      return
    }
    const next = blocks.filter((_, i) => i !== idx)
    onChange(next)
  }, [blocks, onChange])

  const splitBlock = useCallback((idx: number, before: string, after: string) => {
    updateBlock(idx, { content: before })
    const newBlock: Block = { id: generateId(), type: 'paragraph', content: after }
    const next = [...blocks]
    next.splice(idx + 1, 0, newBlock)
    onChange(next)
  }, [blocks, onChange, updateBlock])

  const moveArrow = useCallback((idx: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= blocks.length) return
    const el = document.querySelector(`[data-block-row="${target}"]`)?.querySelector('[contenteditable]')
    if (el) (el as HTMLDivElement).focus()
  }, [blocks.length])

  if (blocks.length === 0) {
    const first: Block = { id: generateId(), type: 'paragraph', content: '' }
    onChange([first])
    return null
  }

  return (
    <div className="space-y-1">
      {blocks.map((block, idx) => (
        <div key={block.id} data-block-row={idx}>
          <BlockRow
            block={block}
            onUpdate={(u) => updateBlock(idx, u)}
            onDelete={() => deleteBlock(idx)}
            onSplit={(before, after) => splitBlock(idx, before, after)}
            onArrow={(dir) => moveArrow(idx, dir)}
            autoFocus={false}
            slashOpen={slashIdx === idx}
            onSlashOpen={(open) => setSlashIdx(open ? idx : null)}
          />
        </div>
      ))}
    </div>
  )
}

function caretOffset(el: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return 0
  const range = sel.getRangeAt(0)
  const pre = document.createRange()
  pre.selectNodeContents(el)
  pre.setEnd(range.startContainer, range.startOffset)
  return pre.toString().length
}

function moveCursorToEnd(el: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  if (sel) { sel.removeAllRanges(); sel.addRange(range) }
}
