import { type PageMeta, emojiList } from '@/lib/pages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Plus, Search, Star, Trash2, FileText, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

interface PageSidebarProps {
  pages: PageMeta[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
}

export function PageSidebar({
  pages,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onToggleFavorite,
}: PageSidebarProps) {
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const favorites = filtered.filter(p => p.is_favorite)
  const others = filtered.filter(p => !p.is_favorite)

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r">
      <div className="p-3 space-y-2 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Páginas</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreate}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar páginas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {favorites.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 pb-1">
                Favoritas
              </p>
              <div className="space-y-0.5">
                {favorites.map(p => (
                  <PageItem
                    key={p.id}
                    page={p}
                    isSelected={p.id === selectedId}
                    onSelect={() => onSelect(p.id)}
                    onDelete={() => setDeleteId(p.id)}
                    onToggleFavorite={() => onToggleFavorite(p.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 pb-1">
              Todas
            </p>
            <div className="space-y-0.5">
              {others.length === 0 && favorites.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                  No hay páginas aún. Crea una nueva.
                </p>
              )}
              {others.map(p => (
                <PageItem
                  key={p.id}
                  page={p}
                  isSelected={p.id === selectedId}
                  onSelect={() => onSelect(p.id)}
                  onDelete={() => setDeleteId(p.id)}
                  onToggleFavorite={() => onToggleFavorite(p.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar página</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) { onDelete(deleteId); setDeleteId(null) }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PageItem({
  page,
  isSelected,
  onSelect,
  onDelete,
  onToggleFavorite,
}: {
  page: PageMeta
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer group transition-colors',
        isSelected
          ? 'bg-accent text-accent-foreground'
          : 'text-foreground/80 hover:bg-accent/50'
      )}
      onClick={onSelect}
    >
      <span className="text-base shrink-0">{page.icon || '📄'}</span>
      <span className="truncate flex-1 text-sm">{page.title || 'Sin título'}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
        className={cn(
          'opacity-0 group-hover:opacity-100 shrink-0 transition-opacity',
          page.is_favorite && 'opacity-100'
        )}
      >
        <Star
          className={cn(
            'h-3.5 w-3.5',
            page.is_favorite ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'
          )}
        />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="opacity-0 group-hover:opacity-100 shrink-0">
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete() }}>
            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
            <span className="text-destructive">Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
