export function generateId() {
    return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11);
}
const META_KEY = 'pages_meta';
export function getPagesMeta() {
    try {
        const raw = localStorage.getItem(META_KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
export function savePagesMeta(meta) {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
}
export function getPageContent(id) {
    try {
        const raw = localStorage.getItem(`page_content_${id}`);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
export function savePageContent(id, blocks) {
    localStorage.setItem(`page_content_${id}`, JSON.stringify(blocks));
}
export function removePageContent(id) {
    localStorage.removeItem(`page_content_${id}`);
}
export function createPageMeta(overrides) {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        title: 'Sin título',
        icon: '📄',
        is_favorite: false,
        sort_order: Date.now(),
        created_at: now,
        updated_at: now,
        ...overrides,
    };
}
export function emojiList() {
    return [
        '📄', '📝', '📋', '📌', '📎', '🎯', '💡', '🚀', '⭐', '🔥',
        '💪', '🧠', '🎵', '📖', '🎨', '🏆', '💻', '📊', '🗂️', '📁',
        '🎉', '✅', '🔄', '📅', '📈', '🏠', '💼', '🎓', '❤️', '👀',
    ];
}
