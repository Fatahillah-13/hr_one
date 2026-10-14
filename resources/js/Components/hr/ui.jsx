// Komponen bersama tampilan HR One (tanpa library tambahan; animasi memakai CSS di app.css).
import { Link } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import Icon, { ICONS } from './Icon';

/* ---------- warna & ikon aplikasi ---------- */
const PALETTE = [
    ['#4C6FFF', '#2F4BD8'], ['#06B6D4', '#0E7490'], ['#8B5CF6', '#6D28D9'], ['#22C55E', '#15803D'],
    ['#F43F5E', '#BE123C'], ['#F59E0B', '#B45309'], ['#6366F1', '#4338CA'], ['#EC4899', '#BE185D'],
];
const GUESS = [
    [/it-?call|helpdesk/, 'headset'],
    [/karyawan|employee|master/, 'id'], [/hr-?system|hrd|^hr$/, 'users'], [/room|booking|meeting|ruang/, 'cal'],
    [/pics|id-?card|foto/, 'cam'], [/atk|inventaris|sedia|stok/, 'box'], [/resign/, 'door'], [/ijin|izin|exit|keluar/, 'exit'],
    [/payroll|gaji/, 'wallet'], [/report|laporan|dashboard/, 'chart'],
];
const COLOR_GUESS = [
    [/it-?call|helpdesk/, ['#25D366', '#128C7E']],
    [/karyawan|employee|master/, ['#6366F1', '#4338CA']], [/hr-?system|hrd|^hr$/, ['#4C6FFF', '#2F4BD8']], [/room|booking|meeting|ruang/, ['#06B6D4', '#0E7490']],
    [/pics|id-?card|foto/, ['#8B5CF6', '#6D28D9']], [/atk|inventaris|sedia|stok/, ['#22C55E', '#15803D']], [/resign/, ['#F43F5E', '#BE123C']],
    [/ijin|izin|exit|keluar/, ['#F59E0B', '#B45309']],
];
export function appColors(app) {
    const guess = `${app?.slug || ''} ${app?.name || ''}`.toLowerCase();
    const hit = COLOR_GUESS.find(([re]) => re.test(guess));
    if (hit) return hit[1];
    const key = String(app?.slug || app?.name || '');
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
}
export function appIcon(app) {
    const icon = String(app?.icon || '').trim();
    if (icon && ICONS.includes(icon)) return { type: 'icon', name: icon };
    if (/^(https?:\/\/|\/)/.test(icon)) return { type: 'img', src: icon };
    const key = `${app?.slug || ''} ${app?.name || ''}`.toLowerCase();
    const hit = GUESS.find(([re]) => re.test(key));
    return hit ? { type: 'icon', name: hit[1] } : { type: 'text' };
}
export const initials = (name = '') => {
    const w = String(name).trim().split(/\s+/).filter(Boolean);
    return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || 'U').slice(0, 2)).toUpperCase();
};

export function AppTile({ app, size = 'md', className }) {
    const [c1, c2] = appColors(app);
    const ic = appIcon(app);
    const dim = size === 'sm' ? 'h-9 w-9 rounded-[11px]' : size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-12 w-12 rounded-[14px]';
    const isz = size === 'sm' ? 'h-[18px] w-[18px]' : size === 'lg' ? 'h-7 w-7' : 'h-[22px] w-[22px]';
    return (
        <span
            className={cn('hx-sheen relative grid shrink-0 place-items-center text-white', dim, className)}
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, boxShadow: `0 10px 20px -10px ${c1}` }}
        >
            {ic.type === 'img' ? (
                <img src={ic.src} alt="" className="h-full w-full rounded-[inherit] object-cover" />
            ) : ic.type === 'icon' ? (
                <Icon name={ic.name} className={cn('relative', isz)} />
            ) : (
                <b className={cn('relative font-extrabold', size === 'sm' ? 'text-xs' : 'text-base')}>{initials(app?.name)}</b>
            )}
        </span>
    );
}

/* ---------- tombol ---------- */
const BTN = {
    primary: 'text-white bg-gradient-to-br from-[#4C6FFF] to-[#2F4BD8] shadow-[0_10px_20px_-12px_rgba(76,111,255,.95)] hover:brightness-110',
    success: 'text-white bg-gradient-to-br from-[#22C55E] to-[#15803D] shadow-[0_10px_20px_-12px_rgba(22,163,74,.9)] hover:brightness-110',
    danger: 'text-white bg-gradient-to-br from-[#F43F5E] to-[#BE123C] shadow-[0_10px_20px_-12px_rgba(190,18,60,.9)] hover:brightness-110',
    outline: 'bg-white border border-[#DDE2EE] text-[#425466] hover:bg-[#F1F3F9]',
    ghost: 'text-white bg-white/15 border border-white/30 hover:bg-white/25',
    white: 'bg-white text-[#2F4BD8] hover:bg-[#EEF2FF]',
};
export function Button({ variant = 'primary', size = 'md', className, loading, children, as, ...props }) {
    const cls = cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-[13.5px]',
        BTN[variant], className,
    );
    const inner = <>{loading && <span className="h-4 w-4 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />}{children}</>;
    if (as === 'a') return <a className={cls} {...props}>{inner}</a>;
    if (as === 'link') return <Link className={cls} {...props}>{inner}</Link>;
    return <button type="button" className={cls} {...props} disabled={loading || props.disabled}>{inner}</button>;
}

/* ---------- label & form ---------- */
export const inputCls = 'block w-full rounded-xl border border-[#DDE2EE] bg-[#FBFCFE] px-3 py-2.5 text-sm text-[#27272E] shadow-none outline-none transition placeholder:text-slate-400 focus:border-[#4C6FFF] focus:bg-white focus:ring-4 focus:ring-[#4C6FFF]/15 disabled:cursor-not-allowed disabled:bg-[#F1F3F9] disabled:text-slate-500';
export function Field({ label, htmlFor, error, hint, className, children }) {
    return (
        <div className={cn('grid gap-1.5', className)}>
            {label && <label htmlFor={htmlFor} className="text-[13px] font-bold text-[#425466]">{label}{hint && <span className="ml-1 font-semibold text-slate-400">{hint}</span>}</label>}
            {children}
            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>
    );
}
export function Switch({ id, checked, onChange, label, description }) {
    return (
        <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
            <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span className="relative mt-0.5 h-[26px] w-11 shrink-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-green-600 peer-focus-visible:ring-4 peer-focus-visible:ring-[#4C6FFF]/30 after:absolute after:left-[3px] after:top-[3px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-300 peer-checked:after:translate-x-[18px]" />
            <span><b className="block text-sm text-[#27272E]">{label}</b>{description && <small className="text-[12.5px] text-slate-500">{description}</small>}</span>
        </label>
    );
}

/* ---------- label status ---------- */
const PILL = { green: 'bg-green-100 text-green-700', gray: 'bg-slate-100 text-slate-500', blue: 'bg-[#E0E7FF] text-[#2F4BD8]', amber: 'bg-amber-100 text-amber-700', red: 'bg-rose-100 text-rose-700', violet: 'bg-violet-100 text-violet-700' };
export function Pill({ tone = 'gray', dot, className, children }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-extrabold', PILL[tone], className)}>
            {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}{children}
        </span>
    );
}
export function Badge({ children, className }) {
    return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#E4ECF7] px-2.5 py-0.5 text-[11px] font-extrabold text-[#505780]', className)}>{children}</span>;
}

/* ---------- modal, sheet, konfirmasi ---------- */
function useEscape(open, onClose) {
    useEffect(() => {
        if (!open) return undefined;
        const fn = (e) => e.key === 'Escape' && onClose?.();
        window.addEventListener('keydown', fn);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = prev; };
    }, [open, onClose]);
}
export function Modal({ open, onClose, title, children, footer, size = 'md', className }) {
    useEscape(open, onClose);
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px]" style={{ animation: 'hx-fade .25s both' }} onClick={onClose} />
            <div className={cn('hx-pop relative flex max-h-[calc(100vh-32px)] w-full flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_30px_60px_-20px_rgba(12,26,75,.45)]', size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-xl', className)}>
                <div className="flex items-center gap-3 border-b border-[#E7EAF3] px-5 py-4">
                    <h3 className="text-base font-extrabold text-[#27272E]">{title}</h3>
                    <button type="button" onClick={onClose} className="ml-auto grid h-8 w-8 place-items-center rounded-lg bg-[#F1F3F9] text-slate-500 hover:text-slate-800" aria-label="Tutup"><Icon name="x" className="h-4 w-4" /></button>
                </div>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="flex justify-end gap-2 border-t border-[#E7EAF3] px-5 py-3.5">{footer}</div>}
            </div>
        </div>,
        document.body,
    );
}
export function Sheet({ open, onClose, side = 'right', title, description, children }) {
    useEscape(open, onClose);
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[72]" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" style={{ animation: 'hx-fade .25s both' }} onClick={onClose} />
            <aside
                className={cn('absolute bottom-0 top-0 flex w-full max-w-[440px] flex-col bg-white shadow-[0_0_50px_-20px_rgba(0,0,0,.45)]', side === 'left' ? 'left-0' : 'right-0')}
                style={{ animation: `${side === 'left' ? 'hx-sheet-l' : 'hx-sheet-r'} .35s var(--hx-ease) both` }}
            >
                <div className="flex items-start gap-3 border-b border-[#E7EAF3] px-5 py-4">
                    <div className="flex-1"><h3 className="text-[17px] font-extrabold text-[#27272E]">{title}</h3>{description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}</div>
                    <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-[#F1F3F9] text-slate-500 hover:text-slate-800" aria-label="Tutup"><Icon name="x" className="h-4 w-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            </aside>
        </div>,
        document.body,
    );
}
export function Confirm({ open, onClose, onConfirm, title, message, confirmLabel = 'Hapus', processing }) {
    return (
        <Modal open={open} onClose={onClose} title={title} size="sm"
            footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button variant="danger" loading={processing} onClick={onConfirm}>{confirmLabel}</Button></>}>
            <div className="grid justify-items-center gap-3 py-2 text-center">
                <span className="hx-pop grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600"><Icon name="alert" className="h-7 w-7" /></span>
                <p className="text-sm text-slate-600">{message}</p>
            </div>
        </Modal>
    );
}

/* ---------- menu baris (titik tiga) ---------- */
export function RowMenu({ label, items }) {
    const [pos, setPos] = useState(null);
    const btn = useRef(null);
    const menu = useRef(null);
    const close = () => setPos(null);
    useLayoutEffect(() => {
        if (!pos || !menu.current) return;
        const r = btn.current.getBoundingClientRect();
        const m = menu.current;
        let top = r.bottom + 6;
        if (top + m.offsetHeight > window.innerHeight - 10) top = r.top - m.offsetHeight - 6;
        const left = Math.max(10, Math.min(window.innerWidth - m.offsetWidth - 10, r.right - m.offsetWidth));
        if (top !== pos.top || left !== pos.left) setPos({ top: Math.max(10, top), left });
    }, [pos]);
    useEffect(() => {
        if (!pos) return undefined;
        const t0 = Date.now();
        const onDoc = (e) => { if (!menu.current?.contains(e.target) && !btn.current?.contains(e.target)) close(); };
        const onScroll = () => { if (Date.now() - t0 > 250) close(); };
        const onKey = (e) => e.key === 'Escape' && close();
        document.addEventListener('mousedown', onDoc);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('scroll', onScroll, true); window.removeEventListener('keydown', onKey); };
    }, [pos]);
    return (
        <>
            <button ref={btn} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={!!pos}
                onClick={() => (pos ? close() : setPos({ top: -999, left: -999 }))}
                className="grid h-9 w-9 place-items-center rounded-[10px] border border-transparent text-slate-500 transition hover:border-[#E7EAF3] hover:bg-[#F1F3F9] hover:text-slate-800">
                <Icon name="more" className="h-5 w-5" />
            </button>
            {pos && createPortal(
                <div ref={menu} role="menu" className="hx-pop fixed z-[75] grid w-44 gap-px rounded-2xl border border-[#E7EAF3] bg-white p-1.5 shadow-[0_20px_40px_-16px_rgba(12,26,75,.4)]" style={{ top: pos.top, left: pos.left }}>
                    {items.map((it, i) => it === '-' ? <hr key={i} className="-mx-1.5 my-1 border-[#E7EAF3]" /> : (
                        <button key={i} type="button" role="menuitem" onClick={() => { close(); it.onClick(); }}
                            className={cn('flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-sm font-semibold transition-all hover:bg-[#F1F3F9] hover:pl-3.5', it.danger ? 'text-rose-600' : 'text-[#425466]')}>
                            <Icon name={it.icon} className={cn('h-4 w-4', it.danger ? 'text-rose-500' : 'text-slate-400')} />{it.label}
                        </button>
                    ))}
                </div>,
                document.body,
            )}
        </>
    );
}

/* ---------- banner judul halaman ---------- */
export function PageHero({ icon = 'grid', title, subtitle, crumbs = [], actions }) {
    return (
        <section className="hx-gradient hx-dots relative isolate overflow-hidden text-white">
            <span className="hx-blob -right-28 -top-44 h-[420px] w-[420px] bg-[radial-gradient(circle,rgba(255,255,255,.22),transparent_70%)]" />
            <span className="hx-blob -bottom-40 -left-24 h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(143,163,255,.55),transparent_70%)] [animation-delay:-4s]" />
            <div className="relative mx-auto max-w-[1240px] px-4 pb-8 pt-5 sm:px-6">
                {crumbs.length > 0 && (
                    <nav className="hx-up flex flex-wrap items-center gap-1.5 text-[13px] text-white/85">
                        {crumbs.map((c, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5">
                                {c.href ? <Link href={c.href} className="hover:underline">{c.label}</Link> : <span>{c.label}</span>}
                                {i < crumbs.length - 1 && <Icon name="next" className="h-3.5 w-3.5" />}
                            </span>
                        ))}
                    </nav>
                )}
                <div className="hx-up mt-3.5 flex flex-wrap items-center gap-4 [animation-delay:.06s]">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] border border-white/30 bg-white/15"><Icon name={icon} className="h-7 w-7" /></span>
                    <div className="min-w-[220px] flex-1">
                        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[30px]">{title}</h1>
                        {subtitle && <p className="mt-0.5 max-w-2xl text-white/85">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
                </div>
            </div>
        </section>
    );
}

/* ---------- kartu & angka berjalan ---------- */
export function Panel({ className, children, ...p }) {
    return <div className={cn('hx-up rounded-[20px] border border-[#E7EAF3] bg-white p-5 shadow-[0_1px_2px_rgba(12,26,75,.06),0_8px_24px_-12px_rgba(12,26,75,.18)]', className)} {...p}>{children}</div>;
}
export function CountUp({ value, duration = 700 }) {
    const [n, setN] = useState(0);
    useEffect(() => {
        let raf; const t0 = performance.now(); const to = Number(value) || 0;
        const step = (t) => { const p = Math.min(1, (t - t0) / duration); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);
    return <span className="tabular-nums">{n}</span>;
}

/* ---------- pesan sukses / gagal dari server ---------- */
export function Flash({ flash }) {
    const [hidden, setHidden] = useState(false);
    useEffect(() => setHidden(false), [flash?.success, flash?.import_errors]);
    if (hidden || (!flash?.success && !(flash?.import_errors?.length))) return null;
    const warn = flash.import_errors?.length > 0;
    return (
        <div className={cn('hx-pop mb-4 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[13.5px]', warn ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-green-200 bg-green-50 text-green-700')} role="status">
            <Icon name={warn ? 'alert' : 'check'} className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
                {flash.success && <b>{flash.success}</b>}
                {warn && (<><p className={flash.success ? 'mt-1' : ''}>Beberapa baris gagal diimport:</p><ul className="mt-1 list-disc pl-5">{flash.import_errors.map((e, i) => <li key={i}>{e}</li>)}</ul></>)}
            </div>
            <button type="button" onClick={() => setHidden(true)} className="text-current/60 hover:opacity-70" aria-label="Tutup pesan"><Icon name="x" className="h-4 w-4" /></button>
        </div>
    );
}
