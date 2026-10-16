import { useState, useMemo } from 'react'
import { Field, inputCls } from '@/Components/hr/ui'
import Icon from '@/Components/hr/Icon'
import { cn } from '@/lib/utils'

export default function RoleFormFields({ data, setData, errors, apps = [] }) {
    const [search, setSearch] = useState('')
    const isSystemAdmin = (data.name || '').trim().toLowerCase() === 'admin'

    const selectedAppIds = data.app_ids || []

    const filteredApps = useMemo(() => {
        if (!search) return apps
        const q = search.toLowerCase()
        return apps.filter((a) => (a.name || '').toLowerCase().includes(q))
    }, [apps, search])

    const toggleApp = (id) => {
        if (isSystemAdmin) return
        const next = selectedAppIds.includes(id)
            ? selectedAppIds.filter((x) => x !== id)
            : [...selectedAppIds, id]
        setData('app_ids', next)
    }

    const selectAll = () => {
        if (isSystemAdmin) return
        setData('app_ids', apps.map((a) => a.id))
    }

    const clearAll = () => {
        if (isSystemAdmin) return
        setData('app_ids', [])
    }

    return (
        <div className="grid gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[#F4F6FB] p-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#2F4BD8] shadow-sm">
                    <Icon name="shield" className="h-5 w-5" />
                </div>
                <div className="min-w-0 text-sm">
                    <b className="block truncate text-[#27272E]">{data.name || 'Nama Role Akses'}</b>
                    <span className="text-xs text-slate-500">
                        {isSystemAdmin
                            ? 'Role Admin memiliki akses penuh ke seluruh menu aplikasi.'
                            : `${selectedAppIds.length} dari ${apps.length} menu aplikasi diizinkan`}
                    </span>
                </div>
            </div>

            <div>
                <Field label="Nama Role" htmlFor="role-name" error={errors.name}>
                    <input
                        id="role-name"
                        className={inputCls}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Contoh: Supervisor, Staff, Auditor"
                        required
                        disabled={isSystemAdmin}
                    />
                </Field>
            </div>

            <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <label className="text-xs font-bold text-[#27272E]">
                            Menu Aplikasi yang Dapat Diakses
                        </label>
                        <p className="text-[11.5px] text-slate-500">
                            Centang aplikasi yang diizinkan untuk dibuka oleh pengguna dengan role ini.
                        </p>
                    </div>
                    {!isSystemAdmin && (
                        <div className="flex items-center gap-1.5 text-xs">
                            <button
                                type="button"
                                onClick={selectAll}
                                className="font-semibold text-[#2F4BD8] hover:underline"
                            >
                                Centang Semua
                            </button>
                            <span className="text-slate-300">&bull;</span>
                            <button
                                type="button"
                                onClick={clearAll}
                                className="font-semibold text-slate-500 hover:text-slate-700 hover:underline"
                            >
                                Kosongkan
                            </button>
                        </div>
                    )}
                </div>

                {isSystemAdmin ? (
                    <div className="rounded-xl border border-blue-100 bg-[#EEF2FF] p-3 text-xs text-[#2F4BD8]">
                        Role <b>Admin</b> secara otomatis memiliki hak akses tak terbatas ke semua menu aplikasi HR One.
                    </div>
                ) : (
                    <div className="rounded-2xl border border-[#E7EAF3] bg-white p-3">
                        <div className="mb-2.5">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama menu aplikasi..."
                                className="w-full rounded-xl border border-[#E7EAF3] bg-[#FAFBFE] px-3 py-1.5 text-xs text-[#27272E] focus:border-[#2F4BD8] focus:bg-white focus:outline-none"
                            />
                        </div>

                        <div className="max-h-[260px] overflow-y-auto pr-1">
                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {filteredApps.map((app) => {
                                    const checked = selectedAppIds.includes(app.id)
                                    return (
                                        <label
                                            key={app.id}
                                            onClick={() => toggleApp(app.id)}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 text-xs transition-colors select-none',
                                                checked
                                                    ? 'border-[#C7D2FE] bg-[#EEF2FF] text-[#2F4BD8] font-bold'
                                                    : 'border-[#F1F3F9] bg-[#FAFBFE] text-[#425466] hover:border-[#DDE2EE] hover:bg-white'
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => {}}
                                                className="h-4 w-4 rounded border-[#DDE2EE] text-[#2F4BD8] focus:ring-[#2F4BD8]"
                                            />
                                            <span className="min-w-0 flex-1 truncate">
                                                {app.name}
                                            </span>
                                        </label>
                                    )
                                })}
                                {filteredApps.length === 0 && (
                                    <div className="col-span-2 py-4 text-center text-xs text-slate-400">
                                        Tidak ada aplikasi ditemukan.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-[#F1F3F9] pt-2 text-[11.5px] text-slate-500">
                            <span>
                                Terpilih: <b>{selectedAppIds.length}</b> aplikasi
                            </span>
                            <span>
                                Total tersedia: {apps.length}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
