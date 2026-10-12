import { Link } from '@inertiajs/react';
import logoImage from '../../images/logo.png';

// Halaman tamu (lupa password, reset password, konfirmasi password, verifikasi email) gaya HR One.
export default function GuestLayout({ children }) {
    return (
        <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10"
            style={{ background: 'radial-gradient(120% 90% at 0% 0%, #5B7BFF 0%, #2F4BD8 45%, #1C2870 100%)' }}>
            <span className="pointer-events-none absolute inset-0 opacity-[.13] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
            <span className="hx-blob -right-32 -top-44 h-[420px] w-[420px] bg-[radial-gradient(circle,rgba(255,255,255,.2),transparent_70%)]" />
            <div className="hx-pop relative w-full max-w-md rounded-[26px] border border-white/25 bg-white/10 p-2.5 shadow-[0_40px_80px_-30px_rgba(10,20,70,.7)] backdrop-blur-xl">
                <div className="rounded-[20px] bg-white px-6 py-7 sm:px-8">
                    <Link href="/" className="mb-5 inline-block">
                        <img src={logoImage} alt="HR One System" className="h-11 w-auto" />
                    </Link>
                    <div className="text-sm text-slate-600">{children}</div>
                </div>
            </div>
        </div>
    );
}
