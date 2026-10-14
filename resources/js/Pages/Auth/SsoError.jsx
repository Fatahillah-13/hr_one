import { Head, Link } from '@inertiajs/react';
import logoImage from '../../../images/logo.png';
import Icon from '@/Components/hr/Icon';

const MESSAGES = {
    unavailable: {
        title: 'Layanan SSO tidak tersedia',
        body: 'Server SSO (Keycloak) sedang tidak dapat dihubungi. Login dengan SSO belum bisa digunakan untuk sementara waktu.',
    },
    failed: {
        title: 'Login SSO gagal',
        body: 'Terjadi kendala saat memproses login SSO. Silakan coba lagi.',
    },
};

export default function SsoError({ reason = 'unavailable' }) {
    const msg = MESSAGES[reason] ?? MESSAGES.unavailable;

    return (
        <div className="relative isolate grid min-h-screen place-items-center overflow-hidden px-4 py-7 font-sans"
            style={{ background: 'radial-gradient(120% 90% at 0% 0%, #5B7BFF 0%, #2F4BD8 45%, #1C2870 100%)' }}>
            <Head title="SSO Tidak Tersedia" />
            <div className="hx-pop relative z-[1] w-full max-w-[460px] rounded-[30px] border border-white/25 bg-white/10 p-2.5 shadow-[0_40px_80px_-30px_rgba(10,20,70,.7)] backdrop-blur-xl">
                <div className="flex flex-col items-center gap-5 rounded-[22px] bg-white px-6 py-10 text-center sm:px-10">
                    <img src={logoImage} alt="HR One System" className="h-12 w-auto" />
                    <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500">
                        <Icon name="alert" className="h-8 w-8" />
                    </span>
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-[#27272E]">{msg.title}</h1>
                        <p className="mt-2 text-[14px] leading-relaxed text-slate-500">{msg.body}</p>
                        <p className="mt-2 text-[13px] text-slate-500">Anda tetap dapat login menggunakan username dan password, atau hubungi tim IT jika masalah berlanjut.</p>
                    </div>
                    <div className="grid w-full gap-2.5">
                        <Link href={route('login')}
                            className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#5B7BFF] to-[#2F4BD8] px-4 py-3.5 text-[15px] font-extrabold text-white shadow-[0_16px_30px_-14px_rgba(47,75,216,.95)] transition hover:-translate-y-0.5 hover:brightness-105">
                            <Icon name="back" className="h-4 w-4" />Kembali ke Login
                        </Link>
                        <a href={route('login-sso')}
                            className="flex items-center justify-center gap-2.5 rounded-2xl border border-[#D9E0FF] bg-white px-4 py-3.5 text-[15px] font-extrabold text-[#2F4BD8] transition hover:border-[#A9B9FF] hover:bg-[#F7F8FF]">
                            <Icon name="shield" className="h-4 w-4" />Coba SSO Lagi
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
