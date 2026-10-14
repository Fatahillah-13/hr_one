import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
    ArrowUpRight,
    Download,
    Eye,
    FileSpreadsheet,
    FilterX,
    IdCard,
    Pencil,
    SearchX,
    SlidersHorizontal,
    UserCheck,
    UserMinus,
    Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import Avatar from "@/Components/Module/Avatar";
import { EmployeeStatusBadge, EmployeeTypeBadge } from "@/Components/Module/Badge";
import Button from "@/Components/Module/Button";
import Dropdown from "@/Components/Module/Dropdown";
import EmptyState from "@/Components/Module/EmptyState";
import { SearchInput, SegmentedControl, SelectField } from "@/Components/Module/FormControls";
import PageHeader from "@/Components/Module/PageHeader";
import Pagination from "@/Components/Module/Pagination";
import StatCard from "@/Components/Module/StatCard";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import useInertiaLoading from "@/hooks/useInertiaLoading";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
    { value: "", label: "Semua" },
    { value: "active", label: "Aktif" },
    { value: "notactive", label: "Tidak aktif" },
];

const TYPE_BAR = [
    { key: "Permanent", label: "Permanent", color: "bg-[#4C6FFF]" },
    { key: "Contract", label: "Contract", color: "bg-amber-400" },
    { key: "Probation", label: "Probation", color: "bg-violet-400" },
];

export default function EmployeesIndex({ employees, filters, options, stats, links }) {
    const reduce = useReducedMotion();
    const loading = useInertiaLoading();

    const [search, setSearch] = useState(filters.search ?? "");
    const debouncedSearch = useDebouncedValue(search, 400);
    const [showFilters, setShowFilters] = useState(
        Boolean(filters.department_id || filters.job_id || filters.exit_statement),
    );

    const departments = useMemo(() => options.departments.map((d) => ({ value: String(d.id), label: d.name })), [options]);
    const jobs = useMemo(() => options.jobs.map((j) => ({ value: String(j.id), label: j.name })), [options]);
    const exitStatements = useMemo(() => options.exit_statements.map((s) => ({ value: s, label: s })), [options]);

    const visit = (changes, { resetPage = true } = {}) => {
        const params = { ...filters, ...changes };
        if (resetPage) delete params.page;
        Object.keys(params).forEach((k) => (params[k] === "" || params[k] == null) && delete params[k]);
        router.get(route("hrd.employees.index"), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Pencarian otomatis setelah user berhenti mengetik.
    const firstRun = useRef(true);
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        if ((filters.search ?? "") !== debouncedSearch) visit({ search: debouncedSearch });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const activeChips = [
        filters.department_id && { key: "department_id", label: departments.find((d) => d.value === String(filters.department_id))?.label },
        filters.job_id && { key: "job_id", label: jobs.find((j) => j.value === String(filters.job_id))?.label },
        filters.exit_statement && { key: "exit_statement", label: filters.exit_statement },
    ].filter(Boolean);

    const hasAnyFilter = Boolean(filters.search || filters.status_employee || activeChips.length);

    const resetAll = () => {
        setSearch("");
        router.get(route("hrd.employees.index"), { per_page: filters.per_page }, { preserveScroll: true, replace: true });
    };

    const openDetail = (id) => router.visit(route("hrd.employees.show", id));

    const totalActive = Math.max(stats.active, 1);
    const rows = employees.data;
    const pageKey = `${employees.current_page}-${JSON.stringify(filters)}`;

    return (
        <AuthenticatedLayout>
            <Head title="Master Karyawan" />

            <PageHeader
                icon={Users}
                breadcrumbs={[{ label: "Dashboard", href: route("dashboard") }, { label: "HRD" }, { label: "Master Karyawan" }]}
                title="Master Karyawan"
                subtitle="Data induk seluruh karyawan dari sistem HRD. Cari, saring, dan lihat profil lengkap dalam satu tempat."
                actions={
                    <>
                        <Dropdown
                            trigger={(props) => (
                                <Button variant="glass" {...props}>
                                    <Download className="h-4 w-4" /> Download Excel
                                </Button>
                            )}
                            items={[
                                { label: "Data lengkap", description: "Semua kolom data karyawan", href: links.export_all, icon: FileSpreadsheet, external: true },
                                { label: "Data standar", description: "Kolom ringkas yang umum dipakai", href: links.export_standard, icon: FileSpreadsheet, external: true },
                            ]}
                        />
                        <Button as="a" variant="secondary" href={links.legacy_index} target="_blank" rel="noopener noreferrer" className="bg-white">
                            Tambah / Upload <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    </>
                }
            />

            <div className="relative mx-auto -mt-16 max-w-7xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
                {/* Statistik */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                    <StatCard index={0} label="Total karyawan" value={stats.total} icon={Users} tone="blue" hint="Seluruh data di sistem HRD" className="col-span-2 xl:col-span-1" />
                    <StatCard index={1} label="Karyawan aktif" value={stats.active} icon={UserCheck} tone="green" hint={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% dari total`} />
                    <StatCard index={2} label="Tidak aktif" value={stats.notactive} icon={UserMinus} tone="gray" hint="Resign, PHK, batal masuk, dll." />
                    <StatCard index={3} label="Komposisi karyawan aktif" icon={IdCard} tone="amber" className="col-span-2 xl:col-span-1">
                        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                            {TYPE_BAR.map((t, i) => (
                                <motion.div
                                    key={t.key}
                                    className={t.color}
                                    initial={reduce ? false : { width: 0 }}
                                    animate={{ width: `${(stats.by_type[t.key] / totalActive) * 100}%` }}
                                    transition={{ duration: 0.9, delay: 0.35 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                />
                            ))}
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            {TYPE_BAR.map((t) => (
                                <div key={t.key}>
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <span className={cn("h-2 w-2 rounded-full", t.color)} />
                                        {t.label}
                                    </div>
                                    <div className="mt-0.5 font-bold text-slate-800">{formatNumber(stats.by_type[t.key])}</div>
                                </div>
                            ))}
                        </div>
                    </StatCard>
                </div>

                {/* Tabel data */}
                <motion.section
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(12,26,75,0.06),0_8px_24px_-12px_rgba(12,26,75,0.18)] ring-1 ring-slate-100"
                >
                    {/* progress bar saat memuat */}
                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                className="absolute inset-x-0 top-0 z-20 h-0.5 origin-left bg-gradient-to-r from-[#4C6FFF] to-[#8FA3FF]"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 0.85 }}
                                exit={{ scaleX: 1, opacity: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Toolbar */}
                    <div className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <SearchInput
                                value={search}
                                onChange={setSearch}
                                placeholder="Cari NIK, nama, atau nomor KTP…"
                                className="lg:max-w-md lg:flex-1"
                            />
                            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                                <SegmentedControl
                                    layoutId="status-filter"
                                    value={filters.status_employee ?? ""}
                                    onChange={(v) => visit({ status_employee: v })}
                                    options={STATUS_OPTIONS}
                                />
                                <Button
                                    variant={showFilters ? "primary" : "secondary"}
                                    onClick={() => setShowFilters((s) => !s)}
                                    aria-expanded={showFilters}
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filter
                                    {activeChips.length > 0 && (
                                        <span className={cn("rounded-full px-1.5 text-[11px]", showFilters ? "bg-white/25" : "bg-[#4C6FFF] text-white")}>
                                            {activeChips.length}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                                        <SelectField label="Departemen" placeholder="Semua departemen" options={departments} value={filters.department_id ? String(filters.department_id) : ""} onChange={(v) => visit({ department_id: v })} />
                                        <SelectField label="Job level" placeholder="Semua job level" options={jobs} value={filters.job_id ? String(filters.job_id) : ""} onChange={(v) => visit({ job_id: v })} />
                                        <SelectField label="Ket. keluar" placeholder="Semua ket. keluar" options={exitStatements} value={filters.exit_statement ?? ""} onChange={(v) => visit({ exit_statement: v })} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {hasAnyFilter && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <AnimatePresence>
                                    {activeChips.map((chip) => (
                                        <motion.button
                                            key={chip.key}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            onClick={() => visit({ [chip.key]: "" })}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#3B5BDB] transition hover:bg-[#E0E7FF]"
                                            title="Hapus filter"
                                        >
                                            {chip.label} <span className="text-[#3B5BDB]/60">✕</span>
                                        </motion.button>
                                    ))}
                                </AnimatePresence>
                                <button onClick={resetAll} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600">
                                    <FilterX className="h-3.5 w-3.5" /> Reset semua
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={cn("transition-opacity duration-200", loading && "opacity-50")}>
                        {rows.length === 0 ? (
                            <EmptyState
                                icon={SearchX}
                                title="Karyawan tidak ditemukan"
                                description="Coba ubah kata kunci atau kurangi filter yang dipakai."
                                action={
                                    hasAnyFilter && (
                                        <Button variant="secondary" onClick={resetAll}>
                                            <FilterX className="h-4 w-4" /> Reset filter
                                        </Button>
                                    )
                                }
                            />
                        ) : (
                            <>
                                {/* Desktop: tabel */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                <th className="px-6 py-3">Karyawan</th>
                                                <th className="px-4 py-3">No. KTP</th>
                                                <th className="px-4 py-3">Departemen / Job</th>
                                                <th className="px-4 py-3">Tipe</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-6 py-3 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody key={pageKey} className="divide-y divide-slate-100">
                                            {rows.map((e, i) => (
                                                <motion.tr
                                                    key={e.id}
                                                    initial={reduce ? false : { opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: Math.min(i, 15) * 0.025 }}
                                                    onClick={() => openDetail(e.id)}
                                                    className="group cursor-pointer transition-colors hover:bg-[#F5F7FF]"
                                                >
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar name={e.name} />
                                                            <div className="min-w-0">
                                                                <div className="truncate font-semibold text-[#27272E] group-hover:text-[#3B5BDB]">{e.name}</div>
                                                                <div className="font-mono text-xs text-slate-500">{e.nik}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs tracking-wide text-slate-500">{e.national_id_masked ?? "—"}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-700">{e.department ?? "—"}</div>
                                                        <div className="text-xs text-slate-500">{e.job_level ?? "—"}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <EmployeeTypeBadge type={e.employee_type} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <EmployeeStatusBadge status={e.status} />
                                                        {e.status === "notactive" && e.exit_statement && (
                                                            <div className="mt-1 max-w-[180px] truncate text-[11px] text-slate-400" title={e.exit_statement}>
                                                                {e.exit_statement}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center justify-end gap-1 opacity-70 transition group-hover:opacity-100" onClick={(ev) => ev.stopPropagation()}>
                                                            <Button as={Link} href={route("hrd.employees.show", e.id)} variant="ghost" size="icon" title="Lihat detail">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                as="a"
                                                                href={`${links.legacy_index}/${e.id}/edit`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Edit di sistem HRD lama"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile: kartu */}
                                <ul key={`m-${pageKey}`} className="divide-y divide-slate-100 md:hidden">
                                    {rows.map((e, i) => (
                                        <motion.li
                                            key={e.id}
                                            initial={reduce ? false : { opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: Math.min(i, 15) * 0.03 }}
                                        >
                                            <Link href={route("hrd.employees.show", e.id)} className="flex items-center gap-3 px-4 py-3 active:bg-slate-50">
                                                <Avatar name={e.name} size="md" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="truncate font-semibold text-[#27272E]">{e.name}</span>
                                                        <EmployeeStatusBadge status={e.status} />
                                                    </div>
                                                    <div className="mt-0.5 font-mono text-xs text-slate-500">{e.nik}</div>
                                                    <div className="mt-0.5 truncate text-xs text-slate-500">
                                                        {[e.department, e.job_level].filter(Boolean).join(" · ") || "—"}
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    <Pagination
                        meta={employees}
                        onPage={(page) => visit({ page }, { resetPage: false })}
                        perPage={filters.per_page}
                        perPageOptions={options.per_page}
                        onPerPage={(per_page) => visit({ per_page })}
                    />
                </motion.section>

                <p className="text-center text-xs text-slate-400">
                    Data dibaca langsung dari database sistem HRD. Tambah, edit, dan upload data masih dilakukan di sistem HRD lama.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
