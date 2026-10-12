import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/Components/hr/Icon';
import { Button, Field, Flash, PageHero, Panel, Pill, initials, inputCls } from '@/Components/hr/ui';
import { STATUS_META, StatusDot, WaIcon, avatarColor, hhmm, statusMeta, waNormalize } from '@/Components/itcall/shared';
import { cn } from '@/lib/utils';

// IT Call: pelapor mengisi form, lalu WhatsApp terbuka dengan pesan yang sudah terisi.
// Pelapor sendiri yang menekan Send. Tidak ada riwayat yang disimpan di HR One.
const CATEGORIES = [
    ['Hardware', 'box'], ['Software', 'grid'], ['Jaringan / Internet', 'link'], ['Printer', 'file'],
    ['Mesin Absensi', 'clock'], ['Akun / Password', 'lock'], ['Lainnya', 'more'],
];
const URGENCY = [
    ['Normal', 'bg-white text-[#27272E] shadow'],
    ['Penting', 'bg-amber-500 text-white shadow'],
    ['Darurat', 'bg-rose-600 text-white shadow'],
];
const MAX = 1000;
const EMPTY = { category: '', location: '', urgency: 'Normal', problem: '', agent: '' };
const pad = (n) => String(n).padStart(2, '0');

function ticket(d) {
    return `ITC-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function buildMessage(form, agent, reporter, d) {
    const when = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ` ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return [
        `*IT CALL #${ticket(d)}*`,
        `*Untuk:* ${agent?.name || '-'}`,
        `*Pelapor:* ${reporter.name}${reporter.division ? ` (${reporter.division})` : ''}`,
        `*Kategori:* ${form.category || '-'}`,
        `*Lokasi:* ${form.location.trim() || '-'}`,
        `*Urgensi:* ${form.urgency}`,
        `*Waktu:* ${when}`,
        '',
        '*Problem:*',
        form.problem.trim() || '…',
        '',
        '_Dikirim dari HR One_',
    ].join('\n');
}
/** HP: wa.me (membuka aplikasi WhatsApp). Komputer: langsung WhatsApp Web. */
function whatsappUrl(number, text) {
    const n = waNormalize(number);
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    return mobile
        ? `https://wa.me/${n}?text=${encodeURIComponent(text)}`
        : `https://web.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(text)}`;
}
/** Tampilan pratinjau: *tebal* dan _miring_ seperti di WhatsApp. */
function WaText({ text }) {
    return text.split('\n').map((line, i) => (
        <span key={i} className="block min-h-[1.2em]">
            {line.split(/(\*[^*]+\*|_[^_]+_)/g).map((part, j) => {
                if (/^\*[^*]+\*$/.test(part)) return <b key={j}>{part.slice(1, -1)}</b>;
                if (/^_[^_]+_$/.test(part)) return <i key={j}>{part.slice(1, -1)}</i>;
                return part;
            })}
        </span>
    ));
}

function MyStatus({ me }) {
    const [note, setNote] = useState(me.status_note || '');
    const [busy, setBusy] = useState(false);
    useEffect(() => setNote(me.status_note || ''), [me.status_note]);
    const save = (status) => {
        setBusy(true);
        router.patch(route('itcall.my-status'), { status, status_note: note }, { preserveScroll: true, onFinish: () => setBusy(false) });
    };
    const m = statusMeta(me.status);
    return (
        <Panel className="grid gap-3 border-[#C7D2FE] bg-gradient-to-br from-[#EEF2FF] to-white to-60%" data-testid="my-status">
            <div className="flex items-center gap-3">
                <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-extrabold text-white" style={{ background: avatarColor(me.id) }}>
                    {initials(me.name)}<StatusDot status={me.status} />
                </span>
                <span className="min-w-0 flex-1"><small className="block text-[11px] text-slate-500">Anda terdaftar sebagai agent</small><b className="text-[15px] text-[#27272E]">Status saya</b></span>
                <Pill tone={m.tone} dot>{m.label}</Pill>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_META).map(([key, s]) => (
                    <button key={key} type="button" disabled={busy} onClick={() => save(key)} data-status={key} aria-pressed={me.status === key}
                        className={cn('flex items-center gap-2 rounded-xl border-[1.5px] bg-white px-3 py-2.5 text-[13px] font-bold transition hover:-translate-y-px disabled:opacity-60',
                            me.status === key ? s.on : 'border-[#DDE2EE] text-[#425466] hover:border-[#A5B4FC]')}>
                        <Icon name={s.icon} className="h-4 w-4" />{s.label}
                    </button>
                ))}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); save(me.status); }}>
                <input id="it-mynote" maxLength={60} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan singkat, mis. Meeting sampai 14:00" className={cn(inputCls, 'min-w-0 flex-1 py-2')} />
                <Button type="submit" size="sm" loading={busy}>Simpan</Button>
            </form>
        </Panel>
    );
}

export default function ItCallIndex({ agents, myAgentId, reporter, resetAt }) {
    const { flash } = usePage().props;
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [now, setNow] = useState(() => new Date());
    const [sent, setSent] = useState(null);
    const formRef = useRef(null);

    // Status agent bisa berubah kapan saja: muat ulang daftar agent tiap 60 detik dan saat tab kembali aktif.
    useEffect(() => {
        const reload = () => router.reload({ only: ['agents', 'myAgentId'], preserveScroll: true, preserveState: true });
        const t = setInterval(reload, 60000);
        const onVis = () => document.visibilityState === 'visible' && reload();
        document.addEventListener('visibilitychange', onVis);
        return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
    }, []);
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

    const me = agents.find((a) => a.id === myAgentId);
    const agent = agents.find((a) => String(a.id) === String(form.agent));
    // Agent yang dipilih ternyata jadi "Tidak ready" / dinonaktifkan: kosongkan pilihan.
    useEffect(() => {
        if (form.agent && (!agent || agent.status === 'off')) {
            setForm((f) => ({ ...f, agent: '' }));
            setErrors((e) => ({ ...e, agent: 'Agent yang dipilih sedang tidak ready. Pilih agent lain.' }));
        }
    }, [agent, form.agent]);

    const message = useMemo(() => buildMessage(form, agent, reporter, now), [form, agent, reporter, now]);
    const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

    const submit = (e) => {
        e.preventDefault();
        const err = {};
        if (!form.category) err.category = 'Pilih kategori masalah.';
        if (!form.problem.trim()) err.problem = 'Problem wajib diisi.';
        if (!agent) err.agent = 'Pilih agent IT dulu.';
        else if (agent.status === 'off') err.agent = `${agent.name} sedang tidak ready. Pilih agent lain.`;
        setErrors(err);
        if (Object.keys(err).length) {
            const el = formRef.current;
            el?.classList.remove('hx-shake'); void el?.offsetWidth; el?.classList.add('hx-shake');
            return;
        }
        const text = buildMessage(form, agent, reporter, new Date());
        const url = whatsappUrl(agent.wa_number, text);
        window.open(url, '_blank', 'noopener');
        setSent({ agent, url });
    };
    const reset = () => { setForm(EMPTY); setErrors({}); setSent(null); };

    const warn = agent && agent.status !== 'ready' && agent.status !== 'off';

    return (
        <AuthenticatedLayout>
            <Head title="IT Call" />
            <PageHero icon="headset" title="IT Call" subtitle="Ada masalah komputer, printer, jaringan, atau absensi? Laporkan ke tim IT lewat WhatsApp."
                crumbs={[{ label: 'Dashboard', href: '/' }, { label: 'IT Call' }]} />
            <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <div className="grid min-w-0 grid-cols-1 gap-4">
                    <Flash flash={flash} />
                    {sent ? (
                        <Panel className="grid justify-items-center gap-3 px-6 py-10 text-center" data-testid="it-sent">
                            <span className="hx-pop grid h-16 w-16 place-items-center rounded-full bg-[#DCFCE7] text-[#128C7E]"><WaIcon className="h-8 w-8" /></span>
                            <h2 className="text-lg font-extrabold text-[#27272E]">WhatsApp sudah dibuka</h2>
                            <p className="max-w-md text-sm text-slate-500">
                                Pesan untuk <b className="text-[#27272E]">{sent.agent.name}</b> sudah terisi. Tekan <b>Send</b> di WhatsApp untuk mengirim. Foto atau screenshot bisa dilampirkan langsung di chat.
                            </p>
                            <div className="mt-2 flex flex-wrap justify-center gap-2">
                                <Button as="a" variant="outline" href={sent.url} target="_blank" rel="noopener noreferrer"><WaIcon className="h-4 w-4" />Buka WhatsApp lagi</Button>
                                <Button onClick={reset}><Icon name="plus" className="h-4 w-4" />Buat laporan baru</Button>
                            </div>
                        </Panel>
                    ) : (
                        <form ref={formRef} onSubmit={submit} noValidate className="hx-up grid gap-4 rounded-[20px] border border-[#E7EAF3] bg-white p-5 shadow-[0_1px_2px_rgba(12,26,75,.06),0_8px_24px_-12px_rgba(12,26,75,.18)]">
                            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E0E7FF] bg-[#F5F7FF] p-3">
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5B7BFF] to-[#2F4BD8] text-[13px] font-extrabold text-white">{initials(reporter.name)}</span>
                                <span className="min-w-[150px] flex-1 leading-tight">
                                    <small className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Pelapor</small>
                                    <b className="text-[#27272E]">{reporter.name}</b>{reporter.division && <span className="ml-1.5 text-[13px] text-slate-500">{reporter.division}</span>}
                                </span>
                                <Pill tone="green" dot>Otomatis dari akun HR One</Pill>
                            </div>

                            <Field label="Kategori" error={errors.category}>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {CATEGORIES.map(([c, ic]) => (
                                        <button key={c} type="button" data-cat={c} aria-pressed={form.category === c} onClick={() => set('category', c)}
                                            className={cn('flex items-center gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-left text-[13px] font-bold transition hover:-translate-y-px',
                                                form.category === c ? 'border-[#4C6FFF] bg-[#EEF2FF] text-[#2F4BD8]' : 'border-[#DDE2EE] bg-white text-[#425466] hover:border-[#A5B4FC]')}>
                                            <Icon name={ic} className="h-4 w-4 shrink-0" />{c}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Lokasi / ruangan" htmlFor="it-loc">
                                    <input id="it-loc" maxLength={100} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Contoh: Ruang HRD lt. 2" className={inputCls} />
                                </Field>
                                <Field label="Urgensi">
                                    <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#F1F3F9] p-1">
                                        {URGENCY.map(([u, on]) => (
                                            <button key={u} type="button" data-urg={u} aria-pressed={form.urgency === u} onClick={() => set('urgency', u)}
                                                className={cn('rounded-[9px] py-2 text-[13px] font-bold transition', form.urgency === u ? on : 'text-slate-500 hover:text-[#27272E]')}>{u}</button>
                                        ))}
                                    </div>
                                </Field>
                            </div>

                            <Field label={<>Problem <span className="text-rose-600">*</span></>} htmlFor="it-prob" error={errors.problem}>
                                <textarea id="it-prob" rows={4} maxLength={MAX} value={form.problem} onChange={(e) => set('problem', e.target.value)}
                                    placeholder="Jelaskan masalahnya. Contoh: printer di ruang HRD tidak bisa print, muncul error paper jam." className={cn(inputCls, 'resize-y')} />
                                <small className="justify-self-end text-xs text-slate-400">{form.problem.length}/{MAX}</small>
                            </Field>

                            <Field label={<>Pilih Agent <span className="text-rose-600">*</span></>} htmlFor="it-agent" error={errors.agent}>
                                <select id="it-agent" value={form.agent} onChange={(e) => set('agent', e.target.value)} className={inputCls}>
                                    <option value="">{agents.length ? 'Pilih agent IT…' : 'Belum ada agent. Hubungi admin HR One.'}</option>
                                    {agents.map((a) => (
                                        <option key={a.id} value={a.id} disabled={a.status === 'off'}>
                                            {a.name} · {statusMeta(a.status).label}{a.status_note ? ` (${a.status_note})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {warn && (
                                    <div className="hx-pop flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-800" data-testid="it-warn">
                                        <Icon name="alert" className="mt-px h-4 w-4 shrink-0" />
                                        <span><b>{agent.name} sedang {statusMeta(agent.status).label.toLowerCase()}{agent.status_note ? ` (${agent.status_note})` : ''}.</b> Respon mungkin lambat. Tetap kirim, atau pilih agent yang Ready.</span>
                                    </div>
                                )}
                            </Field>

                            <button type="submit" className="group flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] px-5 py-3.5 text-[15px] font-extrabold text-white shadow-[0_14px_28px_-14px_rgba(18,140,126,.9)] transition hover:brightness-105 active:scale-[.98]">
                                <WaIcon />Kirim ke WhatsApp<Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </button>
                            <p className="relative pl-6 text-[12.5px] leading-relaxed text-slate-500">
                                <Icon name="alert" className="absolute left-0 top-0.5 h-4 w-4 text-slate-400" />
                                WhatsApp akan terbuka dengan pesan yang sudah terisi. Tekan <b>Send</b> di WhatsApp untuk mengirim. Foto/screenshot bisa dilampirkan langsung di chat.
                            </p>
                        </form>
                    )}
                </div>

                <aside className="grid min-w-0 grid-cols-1 gap-4">
                    <Panel className="[animation-delay:.05s]">
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-[#27272E]"><Icon name="eye" className="h-4 w-4 text-[#4C6FFF]" /><b>Pratinjau pesan</b><small className="ml-auto text-xs text-slate-400">Diperbarui saat mengetik</small></div>
                        <div className="rounded-2xl bg-[#EFEAE2] p-4">
                            <div className="relative ml-auto max-w-[92%] break-words rounded-xl rounded-tr-sm bg-[#D9FDD3] px-3 pb-5 pt-2 text-[13px] leading-snug text-[#111B21] shadow-sm" data-testid="it-bubble">
                                <WaText text={message} />
                                <span className="absolute bottom-1 right-2 text-[10.5px] text-slate-500">{pad(now.getHours())}:{pad(now.getMinutes())}</span>
                            </div>
                        </div>
                    </Panel>

                    {me && <MyStatus me={me} />}

                    <Panel className="[animation-delay:.1s]">
                        <h3 className="mb-2 font-extrabold text-[#27272E]">Agent IT</h3>
                        {agents.length === 0 && <p className="text-sm text-slate-500">Belum ada agent aktif.</p>}
                        <div className="grid grid-cols-1 gap-2">
                            {agents.map((a, i) => {
                                const m = statusMeta(a.status);
                                const off = a.status === 'off';
                                return (
                                    <button key={a.id} type="button" data-ag={a.id} disabled={off} title={off ? 'Agent sedang tidak ready' : undefined}
                                        onClick={() => { setSent(null); set('agent', String(a.id)); }}
                                        style={{ animationDelay: `${i * 0.05}s` }}
                                        className={cn('hx-up flex min-w-0 items-center gap-3 rounded-2xl border-[1.5px] px-3 py-2.5 text-left transition',
                                            String(form.agent) === String(a.id) ? 'border-green-500 bg-green-50' : 'border-transparent bg-[#F6F8FC] hover:-translate-y-px hover:border-[#C7D2FE]',
                                            off && 'cursor-not-allowed opacity-55 hover:translate-y-0 hover:border-transparent')}>
                                        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white" style={{ background: avatarColor(a.id) }}>
                                            {initials(a.name)}<StatusDot status={a.status} />
                                        </span>
                                        <span className="min-w-0 flex-1 leading-tight">
                                            <b className="block text-sm text-[#27272E]">{a.name}</b>
                                            <small className="block truncate text-xs text-slate-500">{[a.role, a.status_note].filter(Boolean).join(' · ')}</small>
                                        </span>
                                        <span className="grid shrink-0 justify-items-end gap-0.5">
                                            <Pill tone={m.tone} dot>{m.label}</Pill>
                                            {hhmm(a.status_changed_at) && <small className="text-[10.5px] text-slate-400">sejak {hhmm(a.status_changed_at)}</small>}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="relative mt-3 pl-6 text-[12px] text-slate-500"><Icon name="clock" className="absolute left-0 top-0.5 h-4 w-4 text-slate-400" />Status kembali <b>Ready</b> otomatis setiap pagi pukul {resetAt}.</p>
                    </Panel>
                </aside>
            </div>
        </AuthenticatedLayout>
    );
}
