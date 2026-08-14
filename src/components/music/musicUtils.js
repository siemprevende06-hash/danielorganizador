import { cn } from '@/lib/utils';
export function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
export function difficultyLabel(difficulty) {
    switch (difficulty) {
        case 'beginner':
            return 'Fácil';
        case 'intermediate':
            return 'Medio';
        case 'advanced':
            return 'Difícil';
        default:
            return '—';
    }
}
export function difficultyBadgeClass(difficulty) {
    switch (difficulty) {
        case 'beginner':
            return 'bg-success/10 text-success border-success/20';
        case 'intermediate':
            return 'bg-warning/10 text-warning border-warning/20';
        case 'advanced':
            return 'bg-destructive/10 text-destructive border-destructive/20';
        default:
            return '';
    }
}
export function masteredCardClass(isMastered) {
    return cn('transition-all hover:shadow-md', isMastered && 'border-success/30 bg-success/5');
}
