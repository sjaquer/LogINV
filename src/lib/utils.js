// Utility to merge class names (like shadcn's cn())
export function cn(...inputs) {
    return inputs
        .filter(Boolean)
        .join(' ')
        .trim();
}

// Format a Firestore Timestamp or Date object to locale string
export function formatDate(value) {
    if (!value) return '—';
    const date = value?.toDate ? value.toDate() : new Date(value);
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function formatDateTime(value) {
    if (!value) return '—';
    const date = value?.toDate ? value.toDate() : new Date(value);
    return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Days until expiration from a Timestamp/Date
export function daysUntil(value) {
    if (!value) return Infinity;
    const date = value?.toDate ? value.toDate() : new Date(value);
    const now = new Date();
    return Math.ceil((date - now) / (1000 * 60 * 60 * 24));
}

// Semáforo color based on days until expiration
export function semaforoColor(days) {
    if (days <= 3) return 'red';
    if (days <= 7) return 'yellow';
    return 'green';
}

export function semaforoBg(days) {
    if (days <= 3) return 'bg-red-500/10 border-red-500/30 text-red-400';
    if (days <= 7) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
}

export function semaforoRowBg(days) {
    if (days <= 3) return 'bg-red-950/30 border-l-2 border-l-red-500';
    if (days <= 7) return 'bg-yellow-950/30 border-l-2 border-l-yellow-500';
    return '';
}
