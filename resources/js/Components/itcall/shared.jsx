// Bagian bersama IT Call (halaman lapor & Settings > IT Call).
import { cn } from '@/lib/utils';

export const STATUS_META = {
    ready: { label: 'Ready', tone: 'green', icon: 'check', dot: 'bg-green-500', on: 'border-green-500 bg-green-50 text-green-700' },
    meeting: { label: 'Meeting', tone: 'amber', icon: 'users', dot: 'bg-amber-500', on: 'border-amber-500 bg-amber-50 text-amber-700' },
    lapangan: { label: 'Di lapangan', tone: 'blue', icon: 'link', dot: 'bg-blue-500', on: 'border-blue-500 bg-blue-50 text-blue-700' },
    off: { label: 'Tidak ready', tone: 'gray', icon: 'clock', dot: 'bg-slate-400', on: 'border-slate-400 bg-slate-100 text-slate-600' },
};
export const statusMeta = (s) => STATUS_META[s] || STATUS_META.ready;

const AV = ['#4C6FFF', '#06B6D4', '#8B5CF6', '#22C55E', '#F43F5E', '#F59E0B', '#6366F1', '#EC4899'];
export const avatarColor = (id) => AV[(Number(id) || 0) % AV.length];

/** 08xx / +62 8xx -> 628xx */
export const waNormalize = (v) => {
    const d = String(v || '').replace(/\D+/g, '');
    return d.startsWith('0') ? `62${d.slice(1)}` : d;
};
/** 6281234567890 -> +62 812-3456-7890 */
export const waDisplay = (v) => {
    const n = waNormalize(v);
    return n ? `+${n.slice(0, 2)} ${n.slice(2, 5)}-${n.slice(5, 9)}-${n.slice(9)}`.replace(/-$/, '') : '-';
};

const pad = (n) => String(n).padStart(2, '0');
export const hhmm = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function StatusDot({ status, className }) {
    return <i className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white', statusMeta(status).dot, status === 'ready' && 'animate-pulse', className)} />;
}

export const WaIcon = ({ className = 'h-5 w-5' }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4 5.2 5.2 0 003.2.7 2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.5-.3z" />
    </svg>
);
