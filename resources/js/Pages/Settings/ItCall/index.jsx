import { router, useForm, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { Button, Confirm, Field, Flash, Modal, Panel, Pill, RowMenu, Switch, initials, inputCls } from '@/Components/hr/ui'
import Icon from '@/Components/hr/Icon'
import { StatusDot, avatarColor, hhmm, statusMeta, waDisplay, waNormalize } from '@/Components/itcall/shared'

// Settings > IT Call (admin): agent tujuan WhatsApp, akun HR One agent, dan status kerjanya.
function AgentForm({ agent, statuses, users, onClose }) {
    const isNew = !agent?.id
    const { data, setData, post, put, processing, errors } = useForm({
        name: agent?.name || '',
        role: agent?.role ?? 'IT Support',
        wa_number: agent?.wa_number || '',
        user_id: agent?.user_id ? String(agent.user_id) : '',
        status: agent?.status || 'ready',
        status_note: agent?.status_note || '',
        is_active: agent ? !!agent.is_active : true,
    })
    const submit = (e) => {
        e?.preventDefault()
        const opts = { preserveScroll: true, onSuccess: () => onClose() }
        if (isNew) post(route('settings.it-agents.store'), opts)
        else put(route('settings.it-agents.update', agent.id), opts)
    }
    const wa = waNormalize(data.wa_number)
    return (
        <Modal open onClose={onClose} title={isNew ? 'Tambah Agent' : 'Edit Agent'}
            footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={submit} loading={processing}>{isNew ? 'Simpan' : 'Update'}</Button></>}>
            <form onSubmit={submit} noValidate className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nama" htmlFor="ag-name" error={errors.name}><input id="ag-name" maxLength={100} value={data.name} onChange={(e) => setData('name', e.target.value)} className={inputCls} /></Field>
                    <Field label="Jabatan" htmlFor="ag-role" error={errors.role}><input id="ag-role" maxLength={100} value={data.role} onChange={(e) => setData('role', e.target.value)} className={inputCls} /></Field>
                </div>
                <Field label="Nomor WhatsApp" htmlFor="ag-wa" error={errors.wa_number}>
                    <input id="ag-wa" inputMode="tel" placeholder="08xx atau 628xx" value={data.wa_number} onChange={(e) => setData('wa_number', e.target.value)} className={inputCls} />
                    <small className="text-xs text-slate-500" data-testid="ag-wa-preview">{wa ? `Disimpan sebagai ${waDisplay(wa)}` : 'Contoh: 0812 3456 7890'}</small>
                </Field>
                <Field label="Akun HR One agent" htmlFor="ag-user" error={errors.user_id}>
                    <select id="ag-user" value={data.user_id} onChange={(e) => setData('user_id', e.target.value)} className={inputCls}>
                        <option value="">— Tidak dihubungkan —</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>)}
                    </select>
                    <small className="text-xs text-slate-500">Akun ini bisa mengganti status kerjanya sendiri dari halaman IT Call.</small>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Status kerja" htmlFor="ag-status" error={errors.status}>
                        <select id="ag-status" value={data.status} onChange={(e) => setData('status', e.target.value)} className={inputCls}>
                            {Object.entries(statuses).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                        </select>
                    </Field>
                    <Field label="Catatan" htmlFor="ag-note" error={errors.status_note}>
                        <input id="ag-note" maxLength={60} placeholder="Meeting sampai 14:00" value={data.status_note} onChange={(e) => setData('status_note', e.target.value)} className={inputCls} />
                    </Field>
                </div>
                <Switch id="ag-active" checked={data.is_active} onChange={(v) => setData('is_active', v)} label="Aktif" description="Hanya agent aktif yang muncul di halaman IT Call." />
            </form>
        </Modal>
    )
}

export default function ItCallSettings({ agents = [], users = [], statuses = {}, resetAt = '07:00' }) {
    const { flash } = usePage().props
    const [editing, setEditing] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [busy, setBusy] = useState(false)
    const handleDelete = () => {
        setBusy(true)
        router.delete(route('settings.it-agents.destroy', deleting.id), { preserveScroll: true, onFinish: () => { setBusy(false); setDeleting(null) } })
    }

    return (
        <Panel className="p-0">
            <div className="flex flex-wrap items-start gap-3 p-5 pb-4">
                <div className="min-w-[200px] flex-1"><h1 className="text-[17px] font-extrabold text-[#27272E]">Agent IT Call</h1><p className="text-[13px] text-slate-500">Agent yang muncul di halaman IT Call dan nomor WhatsApp tujuannya.</p></div>
                <Button onClick={() => setEditing({})}><Icon name="plus" className="h-4 w-4" />Tambah Agent</Button>
            </div>
            <div className="px-5"><Flash flash={flash} /></div>
            <div className="overflow-x-auto border-t border-[#E7EAF3]">
                <table className="w-full text-left text-[13.5px]">
                    <thead><tr className="bg-[#FAFBFE] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                        <th className="px-5 py-3">Agent</th><th className="px-4 py-3">Akun HR One</th><th className="px-4 py-3">Nomor WhatsApp</th><th className="px-4 py-3">Status kerja</th><th className="px-4 py-3">Aktif</th><th className="px-5 py-3 text-right">Aksi</th>
                    </tr></thead>
                    <tbody>
                        {agents.map((a, i) => {
                            const m = statusMeta(a.status)
                            return (
                                <tr key={a.id} className="hx-row-in border-t border-[#F1F3F9] transition-colors hover:bg-[#F8FAFF]" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
                                    <td className="px-5 py-3"><span className="flex items-center gap-3">
                                        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white" style={{ background: avatarColor(a.id) }}>{initials(a.name)}<StatusDot status={a.status} /></span>
                                        <span><b className="block font-bold text-[#27272E]">{a.name}</b><small className="text-[12px] text-slate-500">{a.role || '-'}</small></span>
                                    </span></td>
                                    <td className="px-4 py-3 font-mono text-[12.5px] text-[#425466]">{a.user ? `@${a.user.username}` : <span className="text-slate-400">—</span>}</td>
                                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-[#425466]">{waDisplay(a.wa_number)}</td>
                                    <td className="px-4 py-3">
                                        <Pill tone={m.tone} dot>{m.label}</Pill>
                                        {(a.status_note || hhmm(a.status_changed_at)) && <small className="mt-1 block text-[11.5px] text-slate-500">{[a.status_note, hhmm(a.status_changed_at) && `sejak ${hhmm(a.status_changed_at)}`].filter(Boolean).join(' · ')}</small>}
                                    </td>
                                    <td className="px-4 py-3">{a.is_active ? <Pill tone="green" dot>Aktif</Pill> : <Pill tone="gray" dot>Nonaktif</Pill>}</td>
                                    <td className="px-5 py-3 text-right"><div className="flex justify-end">
                                        <RowMenu label={`Menu ${a.name}`} items={[
                                            { label: 'Edit', icon: 'edit', onClick: () => setEditing(a) }, '-',
                                            { label: 'Hapus', icon: 'trash', danger: true, onClick: () => setDeleting(a) },
                                        ]} />
                                    </div></td>
                                </tr>
                            )
                        })}
                        {agents.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">Belum ada agent. Tekan <b>Tambah Agent</b> untuk mulai.</td></tr>}
                    </tbody>
                </table>
            </div>
            <p className="relative mx-5 my-4 pl-6 text-[12.5px] leading-relaxed text-slate-500">
                <Icon name="shield" className="absolute left-0 top-0.5 h-4 w-4 text-slate-400" />
                Nomor hanya dipakai saat pelapor menekan Kirim. Format bebas (08…, +62…, 62…), otomatis dirapikan. Status kerja kembali <b>Ready</b> otomatis setiap pagi pukul {resetAt}.
            </p>
            {editing && <AgentForm agent={editing.id ? editing : null} statuses={statuses} users={users} onClose={() => setEditing(null)} />}
            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} processing={busy} title="Hapus agent?"
                message={<>Agent <b>{deleting?.name}</b> tidak akan muncul lagi di IT Call.</>} />
        </Panel>
    )
}
