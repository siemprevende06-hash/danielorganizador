import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageList, usePageContent } from '@/hooks/usePages'
import { PageSidebar } from '@/components/notion/PageSidebar'
import { BlockEditor } from '@/components/notion/BlockEditor'
import { emojiList } from '@/lib/pages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Star, FileText, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Paginas() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { pages, loading, createPage, updatePage, deletePage, toggleFavorite } = usePageList()

  const selectedPage = pages.find(p => p.id === id) || null
  const { blocks, setBlocks } = usePageContent(id)

  const [titleDraft, setTitleDraft] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list')

  useEffect(() => {
    if (selectedPage) setTitleDraft(selectedPage.title)
  }, [selectedPage?.id])

  useEffect(() => {
    if (selectedPage) setMobileView('editor')
    else setMobileView('list')
  }, [id, selectedPage])

  useEffect(() => {
    if (id && !selectedPage && !loading) {
      navigate('/paginas', { replace: true })
    }
  }, [id, selectedPage, loading, navigate])

  const handleCreate = () => {
    const page = createPage()
    navigate(`/paginas/${page.id}`)
  }

  const handleSelect = (pageId: string) => {
    navigate(`/paginas/${pageId}`)
  }

  const handleTitleSave = () => {
    if (id && titleDraft.trim()) {
      updatePage(id, { title: titleDraft.trim() })
    }
    setEditingTitle(false)
  }

  const handleDelete = (pageId: string) => {
    if (pageId === id) {
      navigate('/paginas')
    }
    deletePage(pageId)
  }

  return (
    <div className="h-[calc(100vh-3rem)] lg:h-screen flex overflow-hidden">
      {/* Desktop sidebar */}
      <div className="w-64 shrink-0 hidden md:block">
        <PageSidebar
          pages={pages}
          selectedId={id || null}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      {/* Mobile sidebar */}
      <div className={cn('md:hidden flex-1', mobileView !== 'list' && 'hidden')}>
        <PageSidebar
          pages={pages}
          selectedId={id || null}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      {/* Editor */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0 overflow-hidden',
        'md:flex',
        mobileView !== 'editor' && 'hidden md:flex'
      )}>
        {selectedPage ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Page header */}
            <div className="border-b px-4 md:px-6 py-3 flex items-center gap-2 shrink-0">
              <button
                className="md:hidden p-1 -ml-1 rounded-md hover:bg-muted"
                onClick={() => navigate('/paginas')}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-2xl hover:bg-muted rounded-md p-1 transition-colors">
                    {selectedPage.icon || '📄'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="start">
                  <div className="grid grid-cols-6 gap-1">
                    {emojiList().map(emoji => (
                      <button
                        key={emoji}
                        className="text-xl p-1.5 rounded-md hover:bg-accent transition-colors"
                        onClick={() => { updatePage(selectedPage.id, { icon: emoji }) }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {editingTitle ? (
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave()
                    if (e.key === 'Escape') { setTitleDraft(selectedPage.title); setEditingTitle(false) }
                  }}
                  className="text-xl font-bold h-9 px-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-xl font-bold flex-1 cursor-text hover:bg-muted/50 rounded-md px-1 py-1 transition-colors"
                  onClick={() => setEditingTitle(true)}
                >
                  {selectedPage.title || 'Sin título'}
                </h1>
              )}

              <button
                onClick={() => toggleFavorite(selectedPage.id)}
                className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <Star
                  className={cn(
                    'h-4 w-4',
                    selectedPage.is_favorite ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'
                  )}
                />
              </button>
            </div>

            {/* Blocks */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
              <div className="max-w-3xl mx-auto">
                <BlockEditor blocks={blocks} onChange={setBlocks} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <FileText className="h-12 w-12 mx-auto opacity-30" />
              <p className="text-sm">Selecciona o crea una página</p>
              <Button variant="outline" size="sm" onClick={handleCreate}>
                Nueva página
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
