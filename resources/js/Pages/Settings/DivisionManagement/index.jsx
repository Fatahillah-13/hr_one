import { router } from '@inertiajs/react'
import { useState } from 'react'
import { Badge, Button, Confirm, Panel, Pill, RowMenu } from '@/Components/hr/ui'
import Icon from '@/Components/hr/Icon'
import Create from './create'
import Edit from './edit'

export default function DivisionManagement({ divisions = [] }) {
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [editingDivision, setEditingDivision] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [busy, setBusy] = useState(false)

    const handleDelete = () => {
        if (!deleting) return
        setBusy(true)
        router.delete(route('settings.divisions.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setBusy(false)
                setDeleting(null)
            },
        })
    }

    return (
        <Panel className="p-0">
            <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-4">
                <div className="min-w-[200px] flex-1">
                    <h1 className="text-[17px] font-extrabold text-[#27272E]">
                        Menu Kategori Navigasi
                    </h1>
                    <p className="text-[13px] text-slate-500">
                        Menu kategori tab yang tampil di bilah navigasi Beranda HR One dan filter aplikasi.
                    </p>
                </div>
                <Button onClick={() => setOpen(true)}>
                    <Icon name="plus" className="h-4 w-4" />
                    Tambah Menu Kategori
                </Button>
            </div>

            <div className="overflow-x-auto border-t border-[#E7EAF3]">
                <table className="w-full text-left text-[13.5px]">
                    <thead>
                        <tr className="bg-[#FAFBFE] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                            <th className="px-5 py-3">Nama Menu Kategori</th>
                            <th className="px-4 py-3">Slug</th>
                            <th className="px-4 py-3">Jumlah Aplikasi</th>
                            <th className="px-4 py-3">Jumlah User</th>
                            <th className="px-4 py-3">Tipe</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {divisions.map((div, i) => {
                            const isSystem = (div.slug || '').toLowerCase() === 'all'
                            const appCount = div.apps_count ?? 0
                            const userCount = div.users_count ?? 0

                            return (
                                <tr
                                    key={div.id}
                                    className="hx-row-in border-t border-[#F1F3F9] transition-colors hover:bg-[#F8FAFF]"
                                    style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EEF2FF] text-[#2F4BD8]">
                                                <Icon name="grid" className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <b className="block font-bold text-[#27272E]">{div.name}</b>
                                                <small className="font-mono text-[11.5px] text-slate-500">ID #{div.id}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[12.5px] text-[#425466]">
                                        {div.slug || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge tone={appCount > 0 ? 'blue' : 'gray'}>
                                            {appCount} aplikasi
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge tone={userCount > 0 ? 'purple' : 'gray'}>
                                            {userCount} user
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {isSystem ? (
                                            <Pill tone="blue" dot>System Default</Pill>
                                        ) : (
                                            <Pill tone="gray">Custom</Pill>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end">
                                            <RowMenu
                                                label={`Menu ${div.name}`}
                                                items={[
                                                    {
                                                        label: 'Edit',
                                                        icon: 'edit',
                                                        onClick: () => {
                                                            setEditingDivision(div)
                                                            setEditOpen(true)
                                                        },
                                                    },
                                                    ...(!isSystem
                                                        ? [
                                                              '-',
                                                              {
                                                                  label: 'Delete',
                                                                  icon: 'trash',
                                                                  danger: true,
                                                                  onClick: () => setDeleting(div),
                                                              },
                                                          ]
                                                        : []),
                                                ]}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {divisions.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                                    Belum ada menu kategori.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Create open={open} setOpen={setOpen} />
            {editingDivision && (
                <Edit
                    open={editOpen}
                    setOpen={setEditOpen}
                    division={editingDivision}
                />
            )}
            <Confirm
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                processing={busy}
                title="Hapus Menu Kategori?"
                confirmLabel="Delete"
                message={
                    <>
                        Apakah Anda yakin ingin menghapus kategori <b>{deleting?.name}</b>?
                        {deleting?.apps_count > 0 && (
                            <span className="mt-2 block text-amber-600 text-xs font-semibold">
                                Perhatian: Ada {deleting?.apps_count} aplikasi yang terhubung ke kategori ini. Tab kategori akan hilang dari aplikasi tersebut di Beranda.
                            </span>
                        )}
                    </>
                }
            />
        </Panel>
    )
}
