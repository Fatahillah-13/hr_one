import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import Navbar from '@/Components/Navbar';
import VoNotifier from '@/VirtualOffice/VoNotifier';

export default function AuthenticatedLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { props } = usePage();
    const user = props?.auth?.user;

    useEffect(() => {
        const onKeyDown = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-[#F4F6FB]">
            {/* Menu laci (HP) */}
            <div className={`fixed inset-0 z-[80] md:hidden ${sidebarOpen ? 'visible' : 'invisible'}`} aria-hidden={!sidebarOpen}>
                <div className={`absolute inset-0 bg-slate-900/45 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
                <div className={`absolute inset-y-0 left-0 w-[min(280px,82vw)] transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Sidebar onClose={() => setSidebarOpen(false)} />
                </div>
            </div>
            <Navbar user={user} onOpenSidebar={() => setSidebarOpen(true)} />
            <main className="min-w-0 flex-1">{children}</main>
            {/* Virtual Office: popup + suara pesan chat di semua halaman */}
            <VoNotifier />
            <footer className="px-4 py-5 text-center text-xs text-slate-400">HR One System · PT. Hwaseung Indonesia · HRIS V.2.0</footer>
        </div>
    );
}
