import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageList, usePageContent } from '@/hooks/usePages';
import { PageSidebar } from '@/components/notion/PageSidebar';
import { BlockEditor } from '@/components/notion/BlockEditor';
import { emojiList } from '@/lib/pages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
import { Star, FileText, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function Paginas() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { pages, loading, createPage, updatePage, deletePage, toggleFavorite } = usePageList();
    const selectedPage = pages.find(p => p.id === id) || null;
    const { blocks, setBlocks } = usePageContent(id);
    const [titleDraft, setTitleDraft] = useState('');
    const [editingTitle, setEditingTitle] = useState(false);
    const [mobileView, setMobileView] = useState('list');
    useEffect(() => {
        if (selectedPage)
            setTitleDraft(selectedPage.title);
    }, [selectedPage?.id]);
    useEffect(() => {
        if (selectedPage)
            setMobileView('editor');
        else
            setMobileView('list');
    }, [id, selectedPage]);
    useEffect(() => {
        if (id && !selectedPage && !loading) {
            navigate('/paginas', { replace: true });
        }
    }, [id, selectedPage, loading, navigate]);
    const handleCreate = () => {
        const page = createPage();
        navigate(`/paginas/${page.id}`);
    };
    const handleSelect = (pageId) => {
        navigate(`/paginas/${pageId}`);
    };
    const handleTitleSave = () => {
        if (id && titleDraft.trim()) {
            updatePage(id, { title: titleDraft.trim() });
        }
        setEditingTitle(false);
    };
    const handleDelete = (pageId) => {
        if (pageId === id) {
            navigate('/paginas');
        }
        deletePage(pageId);
    };
    return (_jsxs("div", { className: "h-[calc(100vh-3rem)] lg:h-screen flex overflow-hidden", children: [_jsx("div", { className: "w-64 shrink-0 hidden md:block", children: _jsx(PageSidebar, { pages: pages, selectedId: id || null, onSelect: handleSelect, onCreate: handleCreate, onDelete: handleDelete, onToggleFavorite: toggleFavorite }) }), _jsx("div", { className: cn('md:hidden flex-1', mobileView !== 'list' && 'hidden'), children: _jsx(PageSidebar, { pages: pages, selectedId: id || null, onSelect: handleSelect, onCreate: handleCreate, onDelete: handleDelete, onToggleFavorite: toggleFavorite }) }), _jsx("div", { className: cn('flex-1 flex flex-col min-w-0 overflow-hidden', 'md:flex', mobileView !== 'editor' && 'hidden md:flex'), children: selectedPage ? (_jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("div", { className: "border-b px-4 md:px-6 py-3 flex items-center gap-2 shrink-0", children: [_jsx("button", { className: "md:hidden p-1 -ml-1 rounded-md hover:bg-muted", onClick: () => navigate('/paginas'), children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx("button", { className: "text-2xl hover:bg-muted rounded-md p-1 transition-colors", children: selectedPage.icon || '📄' }) }), _jsx(PopoverContent, { className: "w-72", align: "start", children: _jsx("div", { className: "grid grid-cols-6 gap-1", children: emojiList().map(emoji => (_jsx("button", { className: "text-xl p-1.5 rounded-md hover:bg-accent transition-colors", onClick: () => { updatePage(selectedPage.id, { icon: emoji }); }, children: emoji }, emoji))) }) })] }), editingTitle ? (_jsx(Input, { value: titleDraft, onChange: (e) => setTitleDraft(e.target.value), onBlur: handleTitleSave, onKeyDown: (e) => {
                                        if (e.key === 'Enter')
                                            handleTitleSave();
                                        if (e.key === 'Escape') {
                                            setTitleDraft(selectedPage.title);
                                            setEditingTitle(false);
                                        }
                                    }, className: "text-xl font-bold h-9 px-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0", autoFocus: true })) : (_jsx("h1", { className: "text-xl font-bold flex-1 cursor-text hover:bg-muted/50 rounded-md px-1 py-1 transition-colors", onClick: () => setEditingTitle(true), children: selectedPage.title || 'Sin título' })), _jsx("button", { onClick: () => toggleFavorite(selectedPage.id), className: "shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors", children: _jsx(Star, { className: cn('h-4 w-4', selectedPage.is_favorite ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground') }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-4 md:px-6 py-4", children: _jsx("div", { className: "max-w-3xl mx-auto", children: _jsx(BlockEditor, { blocks: blocks, onChange: setBlocks }) }) })] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center text-muted-foreground", children: _jsxs("div", { className: "text-center space-y-2", children: [_jsx(FileText, { className: "h-12 w-12 mx-auto opacity-30" }), _jsx("p", { className: "text-sm", children: "Selecciona o crea una p\u00E1gina" }), _jsx(Button, { variant: "outline", size: "sm", onClick: handleCreate, children: "Nueva p\u00E1gina" })] }) })) })] }));
}
