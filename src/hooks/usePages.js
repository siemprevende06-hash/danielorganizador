import { useState, useEffect, useCallback, useRef } from 'react';
import { getPagesMeta, savePagesMeta, getPageContent, savePageContent, removePageContent, createPageMeta, } from '@/lib/pages';
export function usePageList() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(() => {
        setLoading(true);
        const meta = getPagesMeta();
        meta.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setPages(meta);
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);
    const createPage = useCallback((overrides) => {
        const page = createPageMeta(overrides);
        const meta = getPagesMeta();
        meta.push(page);
        savePagesMeta(meta);
        setPages(prev => [page, ...prev]);
        savePageContent(page.id, []);
        return page;
    }, []);
    const updatePage = useCallback((id, updates) => {
        const meta = getPagesMeta();
        const idx = meta.findIndex(p => p.id === id);
        if (idx === -1)
            return;
        meta[idx] = { ...meta[idx], ...updates, updated_at: new Date().toISOString() };
        savePagesMeta(meta);
        setPages(prev => prev.map(p => p.id === id ? meta[idx] : p));
    }, []);
    const deletePage = useCallback((id) => {
        const meta = getPagesMeta().filter(p => p.id !== id);
        savePagesMeta(meta);
        removePageContent(id);
        setPages(prev => prev.filter(p => p.id !== id));
    }, []);
    const toggleFavorite = useCallback((id) => {
        const meta = getPagesMeta();
        const idx = meta.findIndex(p => p.id === id);
        if (idx === -1)
            return;
        meta[idx].is_favorite = !meta[idx].is_favorite;
        meta[idx].updated_at = new Date().toISOString();
        savePagesMeta(meta);
        setPages(prev => prev.map(p => p.id === id ? meta[idx] : p));
    }, []);
    const favorites = pages.filter(p => p.is_favorite);
    return { pages, loading, favorites, createPage, updatePage, deletePage, toggleFavorite };
}
export function usePageContent(pageId) {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);
    useEffect(() => {
        if (!pageId) {
            setBlocks([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setBlocks(getPageContent(pageId));
        setLoading(false);
    }, [pageId]);
    const updateBlocks = useCallback((newBlocks) => {
        setBlocks(newBlocks);
        if (timerRef.current)
            clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            if (pageId)
                savePageContent(pageId, newBlocks);
        }, 500);
    }, [pageId]);
    const saveNow = useCallback(() => {
        if (pageId)
            savePageContent(pageId, blocks);
    }, [pageId, blocks]);
    useEffect(() => {
        return () => { if (timerRef.current)
            clearTimeout(timerRef.current); };
    }, []);
    return { blocks, setBlocks: updateBlocks, loading, saveNow };
}
