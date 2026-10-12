import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import logoImage from '../../images/logo.png';
import NotebookLmIcon from '../../images/notebooklm.svg';
import Icon from '@/Components/hr/Icon';
import { initials } from '@/Components/hr/ui';
import { cn } from '@/lib/utils';
import { useVoUnread } from '@/VirtualOffice/notify';

// Navbar HR One. Isi menu sama seperti sebelumnya (Dashboard, Profile, Billing, Settings untuk admin, Log out),
// ditambah tautan cepat Beranda / IT Call dan tombol menu untuk HP. Master Karyawan dibuka dari kartu di Beranda,
// Settings dari menu akun (admin).
export default function Navbar({ user, onOpenSidebar }) {
    const { url, props } = usePage();
    const isAdmin = props?.auth?.isAdmin;
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const wrap = useRef(null);
    const path = url.split('?')[0];
    const vo = props?.virtualOffice; // null kalau user tidak punya akses aplikasi Virtual Office
    const voUnread = useVoUnread(vo?.unread ?? 0);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    useEffect(() => {
        if (!open) return undefined;
        const onDoc = (e) => !wrap.current?.contains(e.target) && setOpen(false);
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onDoc);
        window.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('keydown', onKey); };
    }, [open]);

    const links = [
        { label: 'Beranda', href: '/', icon: 'home', active: path === '/' },
        { label: 'IT Call', href: '/it-call', icon: 'headset', active: path.startsWith('/it-call') },
        vo && { label: 'Virtual Office', href: '/virtual-office', icon: 'chat', active: path.startsWith('/virtual-office'), badge: voUnread },
    ].filter(Boolean);

    const item = 'flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-sm font-semibold text-[#425466] transition-all hover:bg-[#F1F3F9] hover:pl-3.5 hover:text-[#27272E]';

    return (
        <header className={cn('sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300',
            scrolled ? 'border-transparent bg-white/80 shadow-[0_10px_30px_-18px_rgba(12,26,75,.35)] backdrop-blur-md backdrop-saturate-150' : 'border-[#E7EAF3] bg-white')}>
            <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6 md:gap-4 md:px-7">
                <button type="button" onClick={onOpenSidebar} className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#F1F3F9] text-[#27272E] md:hidden" aria-label={voUnread > 0 ? `Buka menu, ${voUnread} pesan belum dibaca` : 'Buka menu'}>
                    <Icon name="menu" />
                    {voUnread > 0 && <span className="vo-nav-badge absolute -right-1 -top-1">{voUnread > 99 ? '99+' : voUnread}</span>}
                </button>
                <Link href="/" aria-label="HR One System" className="shrink-0">
                    <img src={logoImage} alt="HR One System" className="h-9 w-auto transition-transform duration-300 hover:scale-[1.04] sm:h-10 md:h-11" />
                </Link>
                <nav className="ml-2 hidden gap-1 md:flex">
                    {links.map((l) => (
                        <Link key={l.href} href={l.href} className={cn('group relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors',
                            l.active ? 'bg-[#EEF2FF] text-[#2F4BD8]' : 'text-[#425466] hover:bg-[#EEF2FF] hover:text-[#2F4BD8]')}>
                            <Icon name={l.icon} className={cn('h-[17px] w-[17px] transition-transform group-hover:-translate-y-px', l.active ? 'text-[#4C6FFF]' : 'text-slate-400 group-hover:text-[#4C6FFF]')} />
                            {l.label}
                            {l.badge > 0 && <span key={l.badge} className="vo-nav-badge is-bump">{l.badge > 99 ? '99+' : l.badge}</span>}
                            {l.active && <span className="absolute -bottom-[11px] left-3.5 right-3.5 h-[3px] origin-left rounded-t bg-gradient-to-r from-[#4C6FFF] to-[#8FA3FF]" style={{ animation: 'hx-grow .4s var(--hx-ease) both' }} />}
                        </Link>
                    ))}
                </nav>
                <div className="ml-auto flex items-center gap-2 sm:gap-3.5">
                    <a href="https://notebooklm.google.com/notebook/ff900944-4d2e-4e48-9dbc-a426bb3ae696" target="_blank" rel="noopener noreferrer"
                        className="grid h-10 w-10 place-items-center rounded-xl transition hover:-rotate-6 hover:bg-[#F1F3F9]" title="NotebookLM">
                        <img src={NotebookLmIcon} alt="Notebook LM" className="h-6 w-6" />
                    </a>
                    <div ref={wrap} className="relative">
                        <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}
                            className={cn('flex items-center gap-2.5 rounded-full border bg-white p-1 transition lg:pr-3', open ? 'border-[#C7D2FE] shadow-[0_0_0_4px_rgba(76,111,255,.12)]' : 'border-[#E7EAF3] hover:border-[#C7D2FE]')}>
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#5B7BFF] to-[#2F4BD8] text-[13px] font-extrabold text-white">{initials(user?.name)}</span>
                            <span className="hidden text-left leading-tight lg:block"><b className="block text-[13.5px] text-[#27272E]">{user?.name}</b><small className="text-[11.5px] text-slate-500">{isAdmin ? 'Admin' : 'User'}</small></span>
                            <Icon name="down" className={cn('hidden h-4 w-4 text-slate-500 transition-transform lg:block', open && 'rotate-180')} />
                        </button>
                        {open && (
                            <div role="menu" className="hx-pop absolute right-0 top-[calc(100%+10px)] z-[60] grid w-60 gap-px rounded-2xl border border-[#E7EAF3] bg-white p-1.5 shadow-[0_24px_48px_-18px_rgba(12,26,75,.4)]">
                                <div className="mb-1 flex items-center gap-2.5 rounded-xl bg-gradient-to-br from-[#EEF2FF] to-white p-2.5">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5B7BFF] to-[#2F4BD8] text-[13px] font-extrabold text-white">{initials(user?.name)}</span>
                                    <span className="min-w-0"><b className="block truncate text-sm text-[#27272E]">{user?.name}</b><small className="block truncate text-xs text-slate-500">{user?.email || user?.username}</small></span>
                                </div>
                                <Link href={route('dashboard')} className={item} role="menuitem"><Icon name="home" className="h-4 w-4 text-slate-400" />Dashboard</Link>
                                <Link href={route('profile.edit')} className={item} role="menuitem"><Icon name="user" className="h-4 w-4 text-slate-400" />Profile</Link>
                                <Link href="/billing" className={item} role="menuitem"><Icon name="wallet" className="h-4 w-4 text-slate-400" />Billing</Link>
                                {isAdmin && <Link href={route('settings')} className={item} role="menuitem"><Icon name="settings" className="h-4 w-4 text-slate-400" />Settings</Link>}
                                <hr className="-mx-1.5 my-1 border-[#E7EAF3]" />
                                <button type="button" role="menuitem" onClick={() => router.post(route('logout'))} className={cn(item, 'text-rose-600 hover:text-rose-700')}><Icon name="out" className="h-4 w-4 text-rose-500" />Log out</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
