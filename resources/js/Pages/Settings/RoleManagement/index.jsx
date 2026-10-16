import { router } from '@inertiajs/react'
import { useState } from 'react'
import { Badge, Button, Confirm, Panel, Pill, RowMenu } from '@/Components/hr/ui'
import Icon from '@/Components/hr/Icon'
import Create from './create'
import Edit from './edit'

export default function RoleManagement({ roles = [], apps = [] }) {
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [editingRole, setEditingRole] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [busy, setBusy] = useState(false)

    const handleDelete = () => {
        if (!deleting) return
        setBusy(true)
        router.delete(route('settings.roles.destroy', deleting.id), {
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
                        Manajemen Akses Role
                    </h1>
                    <p className="text-[13px] text-slate-500">
                        Kelola hak akses dan peran user untuk sistem HR One (Admin, Member, dan peran kustom lainnya).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setOpen(true)}>
                        <Icon name="plus" className="h-4 w-4" />
                        Tambah Role Baru
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto border-t border-[#E7EAF3]">
                <table className="w-full text-left text-[13.5px]">
                    <thead>
                        <tr className="bg-[#FAFBFE] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                            <th className="w-16 px-5 py-3">ID</th>
                            <th className="px-4 py-3">Nama Role</th>
                            <th className="px-4 py-3">Akses Menu Aplikasi</th>
                            <th className="px-4 py-3">Jumlah Pengguna</th>
                            <th className="px-4 py-3">Tipe Role</th>
                            <th className="px-5 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role, i) => {
                            const isSystem = ['admin', 'member'].includes((role.name || '').toLowerCase())
                            const isAdminRole = (role.name || '').toLowerCase() === 'admin'
                            const userCount = role.users_count ?? 0

                            return (
                                <tr
                                    key={role.id}
                                    className="hx-row-in border-t border-[#F1F3F9] transition-colors hover:bg-[#F8FAFF]"
                                    style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
                                >
                                    <td className="px-5 py-3 font-mono text-xs text-slate-400">
                                        #{role.id}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#EEF2FF] text-[#2F4BD8]">
                                                <Icon name="shield" className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <span className="font-bold text-[#27272E]">
                                                    {role.name}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {isAdminRole ? (
                                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                                                <Icon name="check" className="h-3.5 w-3.5" />
                                                Semua Menu (Admin)
                                            </span>
                                        ) : role.apps && role.apps.length > 0 ? (
                                            <div className="flex flex-wrap items-center gap-1 max-w-md">
                                                <span className="font-semibold text-[#2F4BD8]">
                                                    {role.apps.length} menu diizinkan:
                                                </span>
                                                <span className="text-slate-600 truncate max-w-xs" title={role.apps.map(a => a.name).join(', ')}>
                                                    {role.apps.map(a => a.name).slice(0, 3).join(', ')}
                                                    {role.apps.length > 3 && ` +${role.apps.length - 3} lainnya`}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">
                                                Semua (Berdasarkan Divisi)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {userCount > 0 ? (
                                            <Badge tone="blue">
                                                {userCount} Pengguna
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-slate-400">
                                                0 Pengguna
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isSystem ? (
                                            <Pill tone="blue">System Built-in</Pill>
                                        ) : (
                                            <Pill tone="gray">Custom</Pill>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <RowMenu
                                            label={`Menu role ${role.name}`}
                                            items={[
                                                {
                                                    icon: 'edit',
                                                    label: 'Edit Role',
                                                    onClick: () => {
                                                        setEditingRole(role)
                                                        setEditOpen(true)
                                                    },
                                                },
                                                ...(!isSystem
                                                    ? [
                                                          {
                                                              icon: 'trash',
                                                              label: 'Hapus Role',
                                                              danger: true,
                                                              disabled: userCount > 0,
                                                              onClick: () => setDeleting(role),
                                                          },
                                                      ]
                                                    : []),
                                            ]}
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                        {roles.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                                    Belum ada data role. Klik tombol <b>Tambah Role Baru</b> untuk membuatnya.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Create open={open} setOpen={setOpen} apps={apps} />
            <Edit
                open={editOpen}
                setOpen={setEditOpen}
                role={editingRole}
                apps={apps}
            />

            <Confirm
                open={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                title="Hapus Role Akses?"
                message={`Yakin ingin menghapus role "${deleting?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Hapus Role"
                processing={busy}
                onConfirm={handleDelete}
            />
        </Panel>
    )
}
