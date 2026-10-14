import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
    ArrowLeft,
    ArrowUpRight,
    Briefcase,
    Cake,
    Check,
    Copy,
    Eye,
    EyeOff,
    FileWarning,
    Hourglass,
    Landmark,
    MapPin,
    Pencil,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { useState } from "react";

import Avatar from "@/Components/Module/Avatar";
import Badge, { EmployeeStatusBadge, EmployeeTypeBadge } from "@/Components/Module/Badge";
import Button from "@/Components/Module/Button";
import EmptyState from "@/Components/Module/EmptyState";
import { ageFrom, durationSince, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Field yang disamarkan dulu dan bisa ditampilkan dengan klik. */
const SENSITIVE = new Set(["No. KTP", "No. Rekening", "NPWP", "BPJS Ketenagakerjaan", "BPJS Kesehatan", "Nama Ibu Kandung"]);

/** Nilai berisi tanggal ISO akan diformat. */
const isIsoDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

const TABS = [
    { key: "pribadi", label: "Data Pribadi", icon: UserRound },
    { key: "pekerjaan", label: "Pekerjaan", icon: Briefcase },
    { key: "alamat", label: "Alamat", icon: MapPin },
    { key: "keuangan", label: "Bank, BPJS & Pajak", icon: Landmark },
    { key: "riwayat", label: "Riwayat", icon: FileWarning },
];

function SensitiveValue({ value }) {
    const [shown, setShown] = useState(false);
    const [copied, setCopied] = useState(false);
    const text = String(value);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
        } catch {
            /* clipboard tidak tersedia (mis. http non-localhost) */
        }
    };

    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={cn("font-mono tracking-wide", !shown && "select-none")}>
                {shown ? text : "•".repeat(Math.max(text.length - 4, 4)) + text.slice(-4)}
            </span>
            <button
                type="button"
                onClick={() => setShown((s) => !s)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#4C6FFF]"
                title={shown ? "Sembunyikan" : "Tampilkan"}
            >
                {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            {shown && (
                <button
                    type="button"
                    onClick={copy}
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#4C6FFF]"
                    title="Salin"
                >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
            )}
        </span>
    );
}

function InfoGrid({ title, data }) {
    const reduce = useReducedMotion();
    const entries = Object.entries(data ?? {});

    return (
        <div>
            {title && <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>}
            <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {entries.map(([label, value], i) => (
                    <motion.div
                        key={label}
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.025 }}
                        className="flex items-start justify-between gap-4 border-b border-dashed border-slate-100 py-3"
                    >
                        <dt className="text-sm text-slate-500">{label}</dt>
                        <dd className="text-right text-sm font-semibold text-[#27272E]">
                            {value === null || value === "" || value === undefined ? (
                                <span className="font-normal text-slate-300">—</span>
                            ) : SENSITIVE.has(label) ? (
                                <SensitiveValue value={value} />
                            ) : isIsoDate(value) ? (
                                formatDate(value)
                            ) : (
                                value
                            )}
                        </dd>
                    </motion.div>
                ))}
            </dl>
        </div>
    );
}

function QuickFact({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 ring-1 ring-inset ring-slate-100 sm:px-4">
            <Icon className="h-5 w-5 shrink-0 text-[#4C6FFF]" />
            <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
                <div className="break-words text-sm font-bold leading-snug text-[#27272E]">{value ?? "—"}</div>
            </div>
        </div>
    );
}

function HistoryTab({ violations, layoffs }) {
    const reduce = useReducedMotion();

    if (violations.length === 0 && layoffs.length === 0) {
        return (
            <EmptyState
                icon={ShieldCheck}
                title="Riwayat bersih"
                description="Tidak ada catatan pelanggaran maupun pemutusan hubungan kerja untuk karyawan ini."
            />
        );
    }

    return (
        <div className="space-y-8">
            {violations.length > 0 && (
                <div>
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Pelanggaran ({violations.length})</h3>
                    <ol className="relative space-y-4 border-l-2 border-slate-100 pl-6">
                        {violations.map((v, i) => {
                            const cancelled = v.status === "cancel";
                            return (
                                <motion.li
                                    key={v.id}
                                    initial={reduce ? false : { opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    className="relative"
                                >
                                    <span
                                        className={cn(
                                            "absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-white",
                                            cancelled ? "bg-slate-300" : "bg-rose-500",
                                        )}
                                    />
                                    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-100">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="font-semibold text-[#27272E]">{v.type || "Pelanggaran"}</div>
                                            <Badge tone={cancelled ? "gray" : "red"}>{v.status || "—"}</Badge>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
                                            <span>
                                                Tgl. pelanggaran<br />
                                                <b className="text-slate-700">{formatDate(v.date)}</b>
                                            </span>
                                            <span>
                                                Tgl. laporan<br />
                                                <b className="text-slate-700">{formatDate(v.reported_at)}</b>
                                            </span>
                                            <span>
                                                Berlaku s.d.<br />
                                                <b className="text-slate-700">{formatDate(v.ends_at)}</b>
                                            </span>
                                            <span>
                                                No. urut<br />
                                                <b className="text-slate-700">{v.number ?? "—"}</b>
                                            </span>
                                        </div>
                                    </div>
                                </motion.li>
                            );
                        })}
                    </ol>
                </div>
            )}

            {layoffs.length > 0 && (
                <div>
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Pemutusan Hubungan Kerja</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {layoffs.map((l) => (
                            <div key={l.id} className="rounded-xl bg-amber-50/60 p-4 ring-1 ring-inset ring-amber-100">
                                <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">No. SK {l.number ?? "—"}</div>
                                <div className="mt-2 text-sm text-slate-600">
                                    Tanggal PHK <b className="text-slate-800">{formatDate(l.date)}</b>
                                </div>
                                <div className="text-sm text-slate-600">
                                    Mulai berlaku <b className="text-slate-800">{formatDate(l.starts_at)}</b>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmployeeShow({ employee, violations, layoffs, links }) {
    const reduce = useReducedMotion();
    const [tab, setTab] = useState("pribadi");
    const s = employee.sections;

    const tenure = durationSince(s.pekerjaan["Tanggal Masuk"]);
    const age = ageFrom(s.identitas["Tanggal Lahir"]);

    const counts = { riwayat: violations.length + layoffs.length };

    return (
        <AuthenticatedLayout>
            <Head title={`${employee.name} · Master Karyawan`} />

            {/* Cover */}
            <section className="relative h-44 overflow-hidden bg-gradient-to-br from-[#2F4BD8] via-[#4C6FFF] to-[#8FA3FF]">
                <motion.div
                    aria-hidden
                    className="absolute -right-10 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl"
                    animate={reduce ? undefined : { scale: [1, 1.15, 1] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                />
                <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]"
                />
                <div className="relative mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
                    <Link
                        href={route("hrd.employees.index")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur transition hover:bg-white/25"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke daftar
                    </Link>
                </div>
            </section>

            <div className="relative mx-auto -mt-20 max-w-6xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
                {/* Kartu profil */}
                <motion.section
                    initial={reduce ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_32px_-12px_rgba(12,26,75,0.22)] ring-1 ring-slate-100"
                >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center">
                        <motion.div
                            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                        >
                            <Avatar name={employee.name} size="xl" className="ring-4 ring-white" />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-[#27272E]">{employee.name}</h1>
                                <EmployeeStatusBadge status={employee.status} />
                                <EmployeeTypeBadge type={employee.employee_type} />
                            </div>
                            <div className="mt-1 font-mono text-sm text-slate-500">NIK {employee.nik}</div>
                            <div className="mt-1 text-sm text-slate-600">
                                {[employee.job_level, employee.department].filter(Boolean).join(" · ") || "—"}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button as="a" href={links.legacy_profile} target="_blank" rel="noopener noreferrer" variant="secondary">
                                Profil lengkap <ArrowUpRight className="h-4 w-4" />
                            </Button>
                            <Button as="a" href={links.legacy_edit} target="_blank" rel="noopener noreferrer" variant="primary">
                                <Pencil className="h-4 w-4" /> Edit di HRD lama
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <QuickFact icon={Hourglass} label="Masa kerja" value={tenure} />
                        <QuickFact icon={Cake} label="Usia" value={age !== null ? `${age} tahun` : null} />
                        <QuickFact icon={Briefcase} label="Tanggal masuk" value={formatDate(s.pekerjaan["Tanggal Masuk"])} />
                        <QuickFact icon={MapPin} label="Domisili" value={s.alamat["Kota / Kabupaten"]} />
                    </div>
                </motion.section>

                {/* Tab */}
                <motion.section
                    initial={reduce ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,26,75,0.06),0_8px_24px_-12px_rgba(12,26,75,0.18)] ring-1 ring-slate-100"
                >
                    <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 [scrollbar-width:none]" role="tablist">
                        {TABS.map((t) => {
                            const active = tab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setTab(t.key)}
                                    className={cn(
                                        "relative flex shrink-0 items-center gap-2 px-4 py-4 text-sm font-semibold transition-colors",
                                        active ? "text-[#3B5BDB]" : "text-slate-500 hover:text-slate-800",
                                    )}
                                >
                                    <t.icon className="h-4 w-4" />
                                    {t.label}
                                    {counts[t.key] > 0 && (
                                        <span className="rounded-full bg-rose-100 px-1.5 text-[11px] font-bold text-rose-600">{counts[t.key]}</span>
                                    )}
                                    {active && (
                                        <motion.span
                                            layoutId="employee-tab"
                                            className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#4C6FFF]"
                                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={tab}
                                initial={reduce ? false : { opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={reduce ? undefined : { opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                                role="tabpanel"
                            >
                                {tab === "pribadi" && <InfoGrid data={s.identitas} />}
                                {tab === "pekerjaan" && <InfoGrid data={s.pekerjaan} />}
                                {tab === "alamat" && <InfoGrid data={s.alamat} />}
                                {tab === "keuangan" && (
                                    <div className="space-y-8">
                                        <InfoGrid title="Rekening bank" data={s.bank} />
                                        <InfoGrid title="BPJS & pajak" data={s.bpjs_pajak} />
                                    </div>
                                )}
                                {tab === "riwayat" && <HistoryTab violations={violations} layoffs={layoffs} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.section>
            </div>
        </AuthenticatedLayout>
    );
}
