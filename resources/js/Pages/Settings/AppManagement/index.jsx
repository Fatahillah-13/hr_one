import { router } from '@inertiajs/react'
import { useState } from 'react'
import { AppTile, Badge, Button, Confirm, Panel, Pill, RowMenu } from '@/Components/hr/ui'
import Icon from '@/Components/hr/Icon'
import Create from './create'
import Edit from './edit'

// App Management: daftar aplikasi + tambah, edit, hapus (sama seperti sebelumnya; konfirmasi hapus kini berupa dialog).
export default function AppManagement({ apps = [] }) {
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [editingApp, setEditingApp] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [busy, setBusy] = useState(false)
    const [togglingId, setTogglingId] = useState(null)

    const handleToggleActive = (app) => {
        setTogglingId(app.id)
        router.patch(
            route('settings.apps.toggle-active', app.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setTogglingId(null),
            }
        )
    }

    const handleDelete = () => {
        setBusy(true)
        router.delete(route('settings.apps.destroy', deleting.id), { preserveScroll: true, onFinish: () => { setBusy(false); setDeleting(null) } })
    }

    return (
        <Panel className="p-0">
            <div className="flex flex-wrap items-start gap-3 p-5 pb-4">
                <div className="min-w-[200px] flex-1"><h1 className="text-[17px] font-extrabold text-[#27272E]">App Management</h1><p className="text-[13px] text-slate-500">Aplikasi yang tampil di Beranda HR One dan pengaturan SSO-nya.</p></div>
                <Button onClick={() => setOpen(true)}><Icon name="plus" className="h-4 w-4" />Create New App</Button>
            </div>
            <div className="overflow-x-auto border-t border-[#E7EAF3]">
                <table className="w-full text-left text-[13.5px]">
                    <thead><tr className="bg-[#FAFBFE] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                        <th className="px-5 py-3">Name</th><th className="px-4 py-3">Division</th><th className="px-4 py-3">URL</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">SSO</th><th className="px-5 py-3 text-right">Actions</th>
                    </tr></thead>
                    <tbody>
                        {apps.map((app, i) => (
                            <tr key={app.id} className="hx-row-in border-t border-[#F1F3F9] transition-colors hover:bg-[#F8FAFF]" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
                                <td className="px-5 py-3"><span className="flex items-center gap-3"><AppTile app={app} size="sm" /><span><b className="block font-bold text-[#27272E]">{app.name}</b><small className="font-mono text-[11.5px] text-slate-500">{app.slug}</small></span></span></td>
                                <td className="px-4 py-3"><span className="flex flex-wrap gap-1.5">{(app.divisions || []).map((d) => <Badge key={d.id}>{d.name}</Badge>)}{!app.divisions?.length && <span className="text-slate-400">-</span>}</span></td>
                                <td className="max-w-[260px] truncate px-4 py-3 font-mono text-[12.5px] text-[#425466]" title={app.app_link}>{app.app_link}</td>
                                <td className="px-4 py-3">
                                    <button
                                        type="button"
                                        disabled={togglingId === app.id}
                                        onClick={() => handleToggleActive(app)}
                                        title={app.is_active ? 'Klik untuk Disable (Nonaktifkan)' : 'Klik untuk Enable (Aktifkan)'}
                                        className="inline-flex items-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                                    >
                                        {app.is_active ? (
                                            <Pill tone="green" dot>Enabled</Pill>
                                        ) : (
                                            <Pill tone="rose" dot>Disabled</Pill>
                                        )}
                                    </button>
                                </td>
                                <td className="px-4 py-3">{app.sso_enabled ? (<div><Pill tone="green" dot>Enabled</Pill><div className="mt-1 font-mono text-[11px] text-slate-500">{app.sso_client_id}</div></div>) : <Pill tone="gray">Disabled</Pill>}</td>
                                <td className="px-5 py-3 text-right"><div className="flex justify-end">
                                    <RowMenu label={`Menu ${app.name}`} items={[
                                        {
                                            label: app.is_active ? 'Disable App' : 'Enable App',
                                            icon: app.is_active ? 'eyeOff' : 'eye',
                                            onClick: () => handleToggleActive(app),
                                        },
                                        { label: 'Edit', icon: 'edit', onClick: () => { setEditingApp(app); setEditOpen(true) } }, '-',
                                        { label: 'Delete', icon: 'trash', danger: true, onClick: () => setDeleting(app) },
                                    ]} />
                                </div></td>
                            </tr>
                        ))}
                        {apps.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">Belum ada aplikasi.</td></tr>}
                    </tbody>
                </table>
            </div>
            <Create open={open} setOpen={setOpen} />
            {editingApp && <Edit open={editOpen} setOpen={setEditOpen} app={editingApp} />}
            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} processing={busy} title="Hapus aplikasi?" confirmLabel="Delete"
                message={<>Are you sure you want to delete this app? Kartu <b>{deleting?.name}</b> akan hilang dari Beranda.</>} />
        </Panel>
    )
}
