import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import logoImage from '../../../images/logo.png';
import factoryMask from '../../../shapes/factoryMask.svg';
import factoryImage from '../../../images/factoryImage.png';
import Icon from '@/Components/hr/Icon';
import { cn } from '@/lib/utils';

// Login HR One. Fitur sama: username + password, lihat/sembunyikan password, jam berjalan,
// pesan status & error, foto pabrik yang bergerak mengikuti mouse, label versi.
export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [now, setNow] = useState(new Date());
    const [shake, setShake] = useState(0);
    const art = useRef(null);
    const mag = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    useEffect(() => { if (errors.username || errors.password) setShake((n) => n + 1); }, [errors]);

    const formattedTime = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        + ' — ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    // Efek "magnetic": foto sedikit mengikuti posisi mouse (hanya perangkat dengan mouse).
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
            <Head title="Login" />
            <span className="pointer-events-none absolute inset-0 opacity-[.13] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
            <span className="hx-blob -right-32 -top-44 h-[460px] w-[460px] bg-[radial-gradient(circle,rgba(255,255,255,.22),transparent_70%)]" />
            <span className="hx-blob -bottom-40 -left-28 h-[340px] w-[340px] bg-[radial-gradient(circle,rgba(143,163,255,.55),transparent_70%)] [animation-delay:-4s]" />
            <span className="hx-blob -top-16 left-[46%] h-[200px] w-[200px] bg-[radial-gradient(circle,rgba(56,189,248,.35),transparent_70%)] [animation-delay:-8s]" />

            <div className="hx-pop relative z-[1] grid w-full max-w-[1020px] gap-2.5 rounded-[30px] border border-white/25 bg-white/10 p-2.5 shadow-[0_40px_80px_-30px_rgba(10,20,70,.7)] backdrop-blur-xl md:grid-cols-[1fr_1.05fr]">
                <div className="flex flex-col gap-5 rounded-[22px] bg-white px-6 py-8 sm:px-10 sm:py-10">
                    <img src={logoImage} alt="HR One System" className="hx-up h-12 w-auto self-start sm:h-14" />
                    <div className="hx-up [animation-delay:.08s]">
                        <p className="text-[15px] font-bold text-[#2F4BD8]">Halo <span className="hx-wave">👋</span></p>
                        <h1 className="mt-1 text-xl font-extrabold tabular-nums tracking-tight text-[#27272E] sm:text-2xl">{formattedTime}</h1>
                        <p className="mt-1 text-slate-500">Login sekali untuk mengakses seluruh sistem</p>
                    </div>

                    {status && <div className="hx-pop rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{status}</div>}

                    <form key={shake} onSubmit={submit} className={cn('hx-up grid gap-3 [animation-delay:.16s]', shake > 0 && 'hx-shake')}>
                        <label htmlFor="username" className={cn('group', field)}>
                            <span className={fieldIc}><Icon name="user" className="h-5 w-5" /></span>
                            <span className="grid min-w-0 flex-1">
                                <small className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-slate-500">Username</small>
                                <input id="username" type="text" name="username" value={data.username} autoComplete="username"
                                    placeholder="Isikan username anda" onChange={(e) => setData('username', e.target.value)} autoFocus
                                    className="border-0 bg-transparent p-0 py-0.5 text-[15px] text-[#27272E] placeholder:text-slate-400 focus:ring-0" />
                            </span>
                        </label>
                        <InputError message={errors.username} />

                        <label htmlFor="password" className={cn('group', field)}>
                            <span className={fieldIc}><Icon name="lock" className="h-5 w-5" /></span>
                            <span className="grid min-w-0 flex-1">
                                <small className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-slate-500">Password</small>
                                <input id="password" type={showPassword ? 'text' : 'password'} name="password" value={data.password}
                                    autoComplete="current-password" placeholder="Isikan password anda" onChange={(e) => setData('password', e.target.value)}
                                    className="border-0 bg-transparent p-0 py-0.5 text-[15px] text-[#27272E] placeholder:text-slate-400 focus:ring-0" />
                            </span>
                            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                                <Icon name={showPassword ? 'eye' : 'eyeOff'} className="h-4 w-4" />
                            </button>
                        </label>
                        <InputError message={errors.password} />

                        <button type="submit" disabled={processing}
                            className="group mt-1.5 flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#5B7BFF] to-[#2F4BD8] px-4 py-3.5 text-[15px] font-extrabold text-white shadow-[0_16px_30px_-14px_rgba(47,75,216,.95)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-progress disabled:opacity-80 disabled:hover:translate-y-0">
                            {processing ? <><span className="h-4 w-4 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />Memeriksa…</> : <>Login<Icon name="out" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                        </button>
                        <a href={route('login-sso')}
                            className="mt-1 flex items-center justify-center gap-2.5 rounded-2xl border border-[#D9E0FF] bg-white px-4 py-3.5 text-[15px] font-extrabold text-[#2F4BD8] transition hover:-translate-y-0.5 hover:border-[#A9B9FF] hover:bg-[#F7F8FF] focus:outline-none focus:ring-4 focus:ring-[#4C6FFF]/15">
                            <Icon name="shield" className="h-4 w-4" />
                            Login with SSO
                        </a>
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
                        {[['shield', 'Single Sign-On', '-left-3.5 top-[18%]', '0s'], ['grid', 'Semua sistem HRD', '-right-3 top-[46%]', '-1.6s'], ['check', 'Satu akun', 'left-[8%] bottom-[6%]', '-3.2s']].map(([ic, t, pos, d]) => (
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
