import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { Button, Confirm, Flash, Panel, Pill, RowMenu, initials } from '@/Components/hr/ui'
import Icon from '@/Components/hr/Icon'
import { cn } from '@/lib/utils'
import Create from './create'
import ImportUsers from './import'

const COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#0EA5E9', '#F97316', '#22C55E', '#6366F1', '#EF4444']

// User Management: tambah, edit, hapus, import Excel, dan halaman (sama seperti sebelumnya).
export default function Index({ users, roles = [], divisions = [] }) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [busy, setBusy] = useState(false)
    const { flash } = usePage().props
    const list = users?.data || []

    const handleDelete = () => {
        setBusy(true)
        router.delete(route('users.destroy', deleting.id), { preserveScroll: true, onFinish: () => { setBusy(false); setDeleting(null) } })
    }
    const handleEdit = (user) => {
        setSelectedUser({ id: user.id, name: user.name, username: user.username, email: user.email, role_id: user.role?.id ?? '', division_id: user.division?.id ?? '', is_active: user.is_active })
        setIsSheetOpen(true)
    }
    const goTo = (link) => {
        if (!link.url) return
        const page = new URL(link.url).searchParams.get('page') || 1
        router.get(route('settings'), { page, tab: 'users' }, { preserveState: true, preserveScroll: true })
    }

    return (
        <Panel className="p-0">
            <div className="flex flex-wrap items-start gap-3 p-5 pb-4">
                <div className="min-w-[200px] flex-1"><h1 className="text-[17px] font-extrabold text-[#27272E]">User Management</h1><p className="text-[13px] text-slate-500">Akun yang bisa login ke HR One. Divisi menentukan aplikasi yang tampil.</p></div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setIsImportOpen(true)}><Icon name="upload" className="h-4 w-4" />Import Excel</Button>
                    <Button onClick={() => { setSelectedUser(null); setIsSheetOpen(true) }}><Icon name="plus" className="h-4 w-4" />Tambah User</Button>
                </div>
            </div>
            <div className="px-5"><Flash flash={flash} /></div>
            <div className="overflow-x-auto border-t border-[#E7EAF3]">
                <table className="w-full text-left text-[13.5px]">
                    <thead><tr className="bg-[#FAFBFE] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                        <th className="px-5 py-3">Nama</th><th className="px-4 py-3">Username</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Division</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Aksi</th>
                    </tr></thead>
                    <tbody>
                        {list.map((user, i) => (
                            <tr key={user.id} className="hx-row-in border-t border-[#F1F3F9] transition-colors hover:bg-[#F8FAFF]" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
                                <td className="px-5 py-3"><span className="flex items-center gap-3">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white" style={{ background: COLORS[user.id % COLORS.length] }}>{initials(user.name)}</span>
                                    <b className="font-bold text-[#27272E]">{user.name}</b></span></td>
                                <td className="px-4 py-3 font-mono text-[12.5px] text-[#425466]">{user.username}</td>
                                <td className="px-4 py-3 text-[#425466]">{user.email}</td>
                                <td className="px-4 py-3">{user.role ? <Pill tone={user.role.name === 'Admin' ? 'blue' : 'gray'}>{user.role.name}</Pill> : '-'}</td>
                                <td className="px-4 py-3 text-[#425466]">{user.division?.name ?? '-'}</td>
                                <td className="px-4 py-3"><Pill tone={user.is_active ? 'green' : 'gray'} dot>{user.is_active ? 'Aktif' : 'Nonaktif'}</Pill></td>
                                <td className="px-5 py-3"><div className="flex justify-end">
                                    <RowMenu label={`Menu ${user.name}`} items={[
                                        { label: 'Edit', icon: 'edit', onClick: () => handleEdit(user) }, '-',
                                        { label: 'Delete', icon: 'trash', danger: true, onClick: () => setDeleting(user) },
                                    ]} />
                                </div></td>
                            </tr>
                        ))}
                        {list.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">Belum ada user.</td></tr>}
                    </tbody>
                </table>
            </div>
            {users?.last_page > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E7EAF3] px-5 py-3.5 text-[13px] text-slate-500">
                    <p>Menampilkan {users.from}–{users.to} dari {users.total} user</p>
                    <div className="flex gap-1.5">
                        {users.links.map((link, i) => {
                            const isPrev = link.label.includes('Previous'), isNext = link.label.includes('Next')
                            return (
                                <button key={i} type="button" disabled={!link.url} onClick={() => goTo(link)} aria-label={isPrev ? 'Sebelumnya' : isNext ? 'Berikutnya' : `Halaman ${link.label}`}
                                    className={cn('grid h-[34px] min-w-[34px] place-items-center rounded-[10px] border px-2 font-bold transition disabled:cursor-default disabled:opacity-40',
                                        link.active ? 'border-transparent bg-gradient-to-br from-[#4C6FFF] to-[#2F4BD8] text-white' : 'border-[#E7EAF3] bg-white text-[#425466] hover:-translate-y-px hover:bg-[#F1F3F9]')}>
                                    {isPrev ? <Icon name="back" className="h-4 w-4" /> : isNext ? <Icon name="next" className="h-4 w-4" /> : link.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
            <Create open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) setSelectedUser(null) }} user={selectedUser} roles={roles} divisions={divisions} />
            <ImportUsers open={isImportOpen} onOpenChange={setIsImportOpen} />
            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} processing={busy} title="Hapus user?" confirmLabel="Delete"
                message={<>Yakin hapus user <b>{deleting?.name}</b>?</>} />
        </Panel>
    )
}
