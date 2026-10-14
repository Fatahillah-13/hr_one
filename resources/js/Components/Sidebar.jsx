import { Link, router, usePage } from '@inertiajs/react';
import logoImage from '../../images/logo.png';
import Icon from '@/Components/hr/Icon';
import { useVoUnread } from '@/VirtualOffice/notify';

// Menu laci untuk HP. Isi: Home, IT Call, Virtual Office (bila punya akses), Profile, Settings (admin), Logout.
const baseNavItems = [
    { label: 'Home', href: '/', icon: 'home' },
    { label: 'IT Call', href: '/it-call', icon: 'headset' },
    { label: 'Virtual Office', href: '/virtual-office', icon: 'chat', vo: true },
    { label: 'Profile', href: '/profile', icon: 'user' },
    { label: 'Settings', href: '/settings', icon: 'settings', adminOnly: true },
];

function isActive(currentUrl, href) {
    if (href === '/') return currentUrl === '/';
    return currentUrl === href || currentUrl.startsWith(href + '/');
}

export default function Sidebar({ onClose }) {
    const { url, props } = usePage();
    const currentUrl = url.split('?')[0];
    const isAdmin = props.auth?.isAdmin;
    const vo = props.virtualOffice;
    const voUnread = useVoUnread(vo?.unread ?? 0);
    const navItems = baseNavItems.filter((item) => (!item.adminOnly || isAdmin) && (!item.vo || vo));

    return (
        <aside className="flex h-full flex-col gap-4 bg-white p-4 shadow-[20px_0_40px_-20px_rgba(0,0,0,.4)]">
            <div className="flex items-center justify-between">
                <img src={logoImage} alt="Logo" className="h-9 w-auto" />
                <button type="button" onClick={onClose} aria-label="Close sidebar" className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#F1F3F9] text-slate-500">
                    <Icon name="x" className="h-4 w-4" />
                </button>
            </div>
            <nav className="grid flex-1 content-start gap-1">
                {navItems.map((item) => {
                    const active = isActive(currentUrl, item.href);
                    return (
                        <Link key={item.href} href={item.href} onClick={() => onClose?.()}
                            className={['flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition',
                                active ? 'bg-gradient-to-br from-[#4C6FFF] to-[#2F4BD8] text-white shadow-[0_8px_18px_-10px_rgba(76,111,255,.95)]' : 'text-[#2F4BD8] hover:bg-[#EEF2FF]'].join(' ')}>
                            <Icon name={item.icon} className="h-[18px] w-[18px]" />{item.label}
                            {item.vo && voUnread > 0 && <span className="vo-nav-badge ml-auto">{voUnread > 99 ? '99+' : voUnread}</span>}
                        </Link>
                    );
                })}
            </nav>
            <button type="button" onClick={() => router.post('/logout')}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-extrabold text-rose-600 transition hover:bg-rose-100">
                <Icon name="out" className="h-4 w-4" />Logout
            </button>
        </aside>
    );
}
