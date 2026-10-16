import InputError from '@/Components/InputError';
import { Head, useForm, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import logoImage from '../../../images/logo.png';
import factoryMask from '../../../shapes/factoryMask.svg';
import factoryImage from '../../../images/factoryImage.png';
import Icon from '@/Components/hr/Icon';
import { cn } from '@/lib/utils';

export default function FirstLoginResetPassword({ user }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const art = useRef(null);
    const mag = useRef(null);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.first_login.update'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const handleLogout = (e) => {
        e.preventDefault();
        router.post(route('logout'));
    };

    const onMove = (e) => {
        if (!mag.current || !window.matchMedia('(hover: hover)').matches) return;
        const r = art.current.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.06;
        const y = (e.clientY - r.top - r.height / 2) * 0.06;
        mag.current.style.transform = `translate(${x}px, ${y}px) rotateX(${-y / 3}deg) rotateY(${x / 3}deg)`;
    };
    const onLeave = () => { if (mag.current) mag.current.style.transform = ''; };

    const field = 'flex cursor-text items-center gap-3 rounded-2xl border-[1.5px] border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-[#4C6FFF] focus-within:bg-white focus-within:shadow-[0_0_0_5px_rgba(76,111,255,.14)]';
    const fieldIc = 'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EEF2FF] text-[#4C6FFF] transition duration-300 group-focus-within:-rotate-6 group-focus-within:scale-105 group-focus-within:bg-[#4C6FFF] group-focus-within:text-white';

    return (
        <div className="relative isolate grid min-h-screen place-items-center overflow-hidden px-4 py-7 font-sans"
            style={{ background: 'radial-gradient(120% 90% at 0% 0%, #5B7BFF 0%, #2F4BD8 45%, #1C2870 100%)' }}>
            <Head title="Pembaruan Kata Sandi Akun" />
            <span className="pointer-events-none absolute inset-0 opacity-[.13] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
            <span className="hx-blob -right-32 -top-44 h-[460px] w-[460px] bg-[radial-gradient(circle,rgba(255,255,255,.22),transparent_70%)]" />
            <span className="hx-blob -bottom-40 -left-28 h-[340px] w-[340px] bg-[radial-gradient(circle,rgba(143,163,255,.55),transparent_70%)] [animation-delay:-4s]" />

            <div className="hx-pop relative z-[1] grid w-full max-w-[1020px] gap-2.5 rounded-[30px] border border-white/25 bg-white/10 p-2.5 shadow-[0_40px_80px_-30px_rgba(10,20,70,.7)] backdrop-blur-xl md:grid-cols-[1fr_1.05fr]">
                <div className="flex flex-col gap-5 rounded-[22px] bg-white px-6 py-8 sm:px-10 sm:py-10">
                    <img src={logoImage} alt="HR One System" className="hx-up h-12 w-auto self-start sm:h-14" />
                    
                    <div className="hx-up [animation-delay:.08s]">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                            <Icon name="shield" className="h-3.5 w-3.5" />
                            Pembaruan Keamanan Akun
                        </div>
                        <h1 className="mt-2 text-xl font-extrabold tracking-tight text-[#27272E] sm:text-2xl">
                            Buat Password Baru
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Halo <strong>{user?.name || user?.username}</strong>, demi keamanan dan sinkronisasi akun HR One ke seluruh sistem, silakan buat password baru Anda sebelum melanjutkan.
                        </p>
                    </div>

                    <form onSubmit={submit} className="hx-up grid gap-3 [animation-delay:.16s]">
                        <div>
                            <label htmlFor="password" className={cn('group', field)}>
                                <span className={fieldIc}><Icon name="lock" className="h-5 w-5" /></span>
                                <span className="grid min-w-0 flex-1">
                                    <small className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-slate-500">Password Baru</small>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        autoComplete="new-password"
                                        placeholder="Minimal 8 karakter"
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoFocus
                                        className="border-0 bg-transparent p-0 py-0.5 text-[15px] text-[#27272E] placeholder:text-slate-400 focus:ring-0"
                                    />
                                </span>
                                <button type="button" onClick={() => setShowPassword((v) => !v)}
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                                    <Icon name={showPassword ? 'eye' : 'eyeOff'} className="h-4 w-4" />
                                </button>
                            </label>
                            <InputError message={errors.password} className="mt-1.5" />
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className={cn('group', field)}>
                                <span className={fieldIc}><Icon name="check" className="h-5 w-5" /></span>
                                <span className="grid min-w-0 flex-1">
                                    <small className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-slate-500">Konfirmasi Password Baru</small>
                                    <input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        autoComplete="new-password"
                                        placeholder="Ulangi password baru"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="border-0 bg-transparent p-0 py-0.5 text-[15px] text-[#27272E] placeholder:text-slate-400 focus:ring-0"
                                    />
                                </span>
                                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                                    <Icon name={showConfirmPassword ? 'eye' : 'eyeOff'} className="h-4 w-4" />
                                </button>
                            </label>
                            <InputError message={errors.password_confirmation} className="mt-1.5" />
                        </div>

                        <div className="mt-2 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            <button
                                type="submit"
                                disabled={processing}
                                className="group flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#5B7BFF] to-[#2F4BD8] px-4 py-3.5 text-[15px] font-extrabold text-white shadow-[0_16px_30px_-14px_rgba(47,75,216,.95)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-80"
                            >
                                {processing ? (
                                    <><span className="h-4 w-4 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />Menyimpan…</>
                                ) : (
                                    <>Simpan & Lanjutkan<Icon name="check" className="h-4 w-4" /></>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition"
                            >
                                <Icon name="out" className="h-4 w-4 rotate-180" />
                                Keluar
                            </button>
                        </div>
                    </form>
                </div>

                <div ref={art} onMouseMove={onMove} onMouseLeave={onLeave} className="relative hidden flex-col items-center justify-center gap-4 p-7 [perspective:900px] md:flex">
                    <div ref={mag} className="relative aspect-[367.5/450] w-full max-w-[400px] transition-transform duration-300 [transform-style:preserve-3d]">
                        <div className="hx-pop absolute inset-0 bg-cover bg-center [animation-delay:.15s]"
                            style={{
                                backgroundImage: `linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.05)), url('${factoryImage}')`,
                                WebkitMaskImage: `url('${factoryMask}')`, maskImage: `url('${factoryMask}')`,
                                WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                                filter: 'drop-shadow(0 24px 32px rgba(0, 0, 0, 0.25))',
                            }} />
                        {[['shield', 'Perlindungan Akun', '-left-3.5 top-[18%]', '0s'], ['lock', 'Enkripsi Kuat', '-right-3 top-[46%]', '-1.6s'], ['check', 'Akses Aman', 'left-[8%] bottom-[6%]', '-3.2s']].map(([ic, t, pos, d]) => (
                            <span key={t} className={cn('hx-bob absolute inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white/95 px-3.5 py-2 text-[12.5px] font-extrabold text-[#27272E] shadow-[0_14px_28px_-12px_rgba(10,20,70,.55)]', pos)}
                                style={{ animationDelay: d, transform: 'translateZ(40px)' }}>
                                <Icon name={ic} className="h-[15px] w-[15px] text-[#4C6FFF]" />{t}
                            </span>
                        ))}
                    </div>
                    <p className="text-[13px] font-bold tracking-[.08em] text-white/85">HRIS System V.2.0</p>
                </div>
            </div>
        </div>
    );
}
