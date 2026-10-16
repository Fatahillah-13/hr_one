import { useEffect, useState } from 'react'
import { Button, Field, inputCls } from '@/Components/hr/ui'

// Form user (dipakai panel Tambah/Edit dan halaman Edit). Field sama seperti sebelumnya.
export default function Form({ user = null, roles = [], divisions = [], submitLabel = 'Simpan', onSubmit, errors = {}, processing = false }) {
    const initial = () => ({
        name: user?.name ?? '', username: user?.username ?? '', email: user?.email ?? '', password: '',
        role_id: user?.role_id ?? '', division_id: user?.division_id ?? '', is_active: user?.is_active ?? true,
    })
    const [data, setDataState] = useState(initial)
    useEffect(() => { setDataState(initial()) }, [user?.id])
    const setData = (k, v) => setDataState((d) => ({ ...d, [k]: v }))
    const submit = (e) => { e.preventDefault(); onSubmit(data) }
    return (
        <form onSubmit={submit} className="grid gap-4">
            <Field label="Nama" htmlFor="u-name" error={errors.name}><input id="u-name" className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus /></Field>
            <Field label="Username" htmlFor="u-username" error={errors.username}><input id="u-username" className={inputCls} value={data.username} onChange={(e) => setData('username', e.target.value)} autoComplete="off" /></Field>
            <Field label="Email" htmlFor="u-email" error={errors.email}><input id="u-email" type="email" className={inputCls} value={data.email} onChange={(e) => setData('email', e.target.value)} /></Field>
            <Field label="Password" hint={user ? '(kosongkan jika tidak diubah)' : ''} htmlFor="u-pass" error={errors.password}>
                <input id="u-pass" type="password" className={inputCls} value={data.password} onChange={(e) => setData('password', e.target.value)} autoComplete="new-password" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Role" htmlFor="u-role" error={errors.role_id}>
                    <select id="u-role" className={inputCls} value={String(data.role_id)} onChange={(e) => setData('role_id', e.target.value)}>
                        <option value="">Pilih role</option>
                        {roles.map((role) => <option key={role.id} value={String(role.id)}>{role.name}</option>)}
                    </select>
                </Field>
                <Field label="Division" htmlFor="u-div" error={errors.division_id}>
                    <select id="u-div" className={inputCls} value={data.division_id === null || data.division_id === '' ? '' : String(data.division_id)} onChange={(e) => setData('division_id', e.target.value)}>
                        <option value="">All (Semua Divisi)</option>
                        {divisions.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                    </select>
                </Field>
            </div>
            <Field label="Status" htmlFor="u-status" error={errors.is_active}>
                <select id="u-status" className={inputCls} value={data.is_active ? '1' : '0'} onChange={(e) => setData('is_active', e.target.value === '1')}>
                    <option value="1">Aktif</option><option value="0">Nonaktif</option>
                </select>
            </Field>
            <Button type="submit" loading={processing} className="mt-1 w-full">{submitLabel}</Button>
        </form>
    )
}
