import { usePage } from '@inertiajs/react'
import { AppTile, Field, Switch, inputCls } from '@/Components/hr/ui'
import Icon, { ICONS } from '@/Components/hr/Icon'
import { cn } from '@/lib/utils'

// Isian form aplikasi (dipakai Create & Edit). Field sama seperti sebelumnya.
export default function AppFormFields({ data, setData, errors, isEdit, slugTouched, setSlugTouched }) {
    const { divisions = [] } = usePage().props
    const toggleDiv = (id) => setData('division_ids', data.division_ids.includes(id) ? data.division_ids.filter((x) => x !== id) : [...data.division_ids, id])
    const onName = (v) => {
        setData((d) => ({ ...d, name: v, ...(!isEdit && !slugTouched ? { slug: v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}) }))
    }
    return (
        <div className="grid gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[#F4F6FB] p-3">
                <AppTile app={{ name: data.name || 'App', slug: data.slug, icon: data.icon }} />
                <div className="min-w-0 text-sm"><b className="block truncate text-[#27272E]">{data.name || 'Nama aplikasi'}</b><span className="text-xs text-slate-500">Pratinjau kartu di Beranda</span></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name" htmlFor="app-name" error={errors.name}><input id="app-name" className={inputCls} value={data.name} onChange={(e) => onName(e.target.value)} placeholder="App name" /></Field>
                <Field label="Slug" htmlFor="app-slug" error={errors.slug}><input id="app-slug" className={inputCls} value={data.slug} onChange={(e) => { setSlugTouched?.(true); setData('slug', e.target.value) }} placeholder="app-slug" /></Field>
            </div>
            <Field label="Description" htmlFor="app-desc" error={errors.description}><input id="app-desc" className={inputCls} value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Short description" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Icon" htmlFor="app-icon" error={errors.icon}>
                    <input id="app-icon" className={inputCls} value={data.icon} onChange={(e) => setData('icon', e.target.value)} placeholder="Icon name or URL" list="hx-icon-names" />
                    <datalist id="hx-icon-names">{ICONS.map((n) => <option key={n} value={n} />)}</datalist>
                </Field>
                <Field label="App Link" htmlFor="app-link" error={errors.app_link}><input id="app-link" type="text" className={inputCls} value={data.app_link} onChange={(e) => setData('app_link', e.target.value)} placeholder="https://example.com, /internal-path, atau 10.10.100.193:8500" /></Field>
            </div>
            <div className={cn('grid gap-3 rounded-2xl border p-4 transition-colors', data.is_active ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40')}>
                <Switch id={isEdit ? 'edit-is-active' : 'create-is-active'} checked={Boolean(data.is_active)} onChange={(v) => setData('is_active', v)}
                    label={data.is_active ? 'Status: Active (Enabled)' : 'Status: Inactive (Disabled)'}
                    description="Jika dinonaktifkan, aplikasi tidak akan tampil di kartu Beranda HR One untuk semua user." />
            </div>
            <div className={cn('grid gap-3 rounded-2xl border p-4 transition-colors', data.sso_enabled ? 'border-emerald-200 bg-emerald-50/60' : 'border-[#E7EAF3] bg-[#FAFBFE]')}>
                <Switch id={isEdit ? 'edit-sso-enabled' : 'create-sso-enabled'} checked={data.sso_enabled} onChange={(v) => setData('sso_enabled', v)}
                    label="Enable SSO" description="Gunakan one-time code dan JWT exchange untuk aplikasi ini." />
                <div className={cn('grid gap-3 overflow-hidden transition-all duration-300', data.sso_enabled ? 'max-h-[400px] opacity-100' : 'pointer-events-none max-h-0 opacity-40')}>
                    <Field label="SSO Client ID" htmlFor="app-cid" error={errors.sso_client_id}><input id="app-cid" className={inputCls} value={data.sso_client_id} onChange={(e) => setData('sso_client_id', e.target.value)} placeholder="payroll-local" disabled={!data.sso_enabled} /></Field>
                    <Field label="SSO Redirect URI" htmlFor="app-redir" error={errors.sso_redirect_uri}><input id="app-redir" type="url" className={inputCls} value={data.sso_redirect_uri} onChange={(e) => setData('sso_redirect_uri', e.target.value)} placeholder="http://localhost:8001/sso/callback" disabled={!data.sso_enabled} /></Field>
                    <Field label="SSO Client Secret" htmlFor="app-secret" error={errors.sso_client_secret}><input id="app-secret" className={inputCls} value={data.sso_client_secret} onChange={(e) => setData('sso_client_secret', e.target.value)} placeholder={isEdit ? 'Kosongkan jika tidak diubah' : 'Minimal 12 karakter'} disabled={!data.sso_enabled} autoComplete="off" /></Field>
                </div>
            </div>
            <Field label="Divisions" error={errors.division_ids}>
                <div className="flex flex-wrap gap-2">
                    {divisions.map((d) => {
                        const on = data.division_ids.includes(d.id)
                        return (
                            <button key={d.id} type="button" onClick={() => toggleDiv(d.id)} aria-pressed={on}
                                className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-bold transition', on ? 'border-indigo-300 bg-[#EEF2FF] text-[#2F4BD8]' : 'border-[#DDE2EE] bg-white text-[#425466] hover:border-indigo-200')}>
                                <span className={cn('overflow-hidden transition-all', on ? 'w-3.5' : 'w-0')}><Icon name="check" className="h-3.5 w-3.5" /></span>{d.name}
                            </button>
                        )
                    })}
                    {divisions.length === 0 && <span className="text-sm text-slate-500">Belum ada divisi.</span>}
                </div>
            </Field>
        </div>
    )
}
