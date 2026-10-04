import { useState, useMemo } from 'react'
import { emojiCategories } from '@/lib/pages'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageIconPickerProps {
  currentIcon: string
  onSelect: (icon: string | null) => void
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function PageIconPicker({ currentIcon, onSelect }: PageIconPickerProps) {
  const [search, setSearch] = useState('')

  const categories = useMemo(() => {
    const query = normalize(search.trim())
    if (!query) return emojiCategories()

    return emojiCategories()
      .map(cat => ({
        name: cat.name,
        keywords: cat.keywords,
        emojis: cat.emojis.filter(
          emoji => normalize(cat.keywords[emoji]?.join(' ') ?? '').includes(query),
        ),
      }))
      .filter(cat => cat.emojis.length > 0)
  }, [search])

  return (
    <div className="w-72 p-2 space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-muted-foreground">Actual:</span>
        <span className="text-lg">{currentIcon}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={() => onSelect(null)}
        >
          <X className="h-3 w-3 mr-1" />
          Quitar
        </Button>
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-3 pr-2">
          {categories.length === 0 && (
            <p className="px-1 py-4 text-center text-xs text-muted-foreground">
              Sin resultados para "{search.trim()}"
            </p>
          )}
          {categories.map((category) => (
            <div key={category.name}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1 mb-1">
                {category.name}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={category.keywords[emoji]?.[0] ?? emoji}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-md text-lg transition-colors',
                      'hover:bg-accent',
                      currentIcon === emoji && 'bg-accent ring-1 ring-primary'
                    )}
                    onClick={() => onSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
