import { useForm, usePage } from '@inertiajs/react'
import React from "react";
import Modal from '@/Components/ui/modal';
import Button from '@/Components/ui/button';
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import MultiSelector from '@/Components/MultiSelector'

export default function Edit({ open, setOpen, app }) {
    const { divisions = [] } = usePage().props

    const { data, setData, put, processing, errors, reset } = useForm({
        name: app?.name || '',
        slug: app?.slug || '',
        description: app?.description || '',
        icon: app?.icon || '',
        app_link: app?.app_link || '',
        sso_enabled: Boolean(app?.sso_enabled),
        sso_client_id: app?.sso_client_id || '',
        sso_redirect_uri: app?.sso_redirect_uri || '',
        sso_client_secret: '',
        division_ids: app?.divisions?.map(d => d.id) || [],
    })

    React.useEffect(() => {
        if (app) {
            setData({
                name: app.name || '',
                slug: app.slug || '',
                description: app.description || '',
                icon: app.icon || '',
                app_link: app.app_link || '',
                sso_enabled: Boolean(app.sso_enabled),
                sso_client_id: app.sso_client_id || '',
                sso_redirect_uri: app.sso_redirect_uri || '',
                sso_client_secret: '',
                division_ids: app.divisions?.map(d => d.id) || [],
            })
        }
    }, [app])

    const handleClose = () => {
        setOpen(false)
        reset()
    }

    const submit = (e) => {
        e.preventDefault()
        put(route('settings.apps.update', app.id), {
            onSuccess: () => handleClose(),
        })
    }

    return (
        <Modal isOpen={open} onClose={handleClose} title="Edit App" size="md">
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label>Name</Label>
                    <Input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="App name"
                    />
                    {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
                </div>

                <div>
                    <Label>Slug</Label>
                    <Input
                        type="text"
                        value={data.slug}
                        onChange={(e) => setData('slug', e.target.value)}
                        placeholder="app-slug"
                    />
                    {errors.slug && <div className="text-red-500 text-sm">{errors.slug}</div>}
                </div>

                <div>
                    <Label>Description</Label>
                    <Input
                        type="text"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Short description"
                    />
                    {errors.description && <div className="text-red-500 text-sm">{errors.description}</div>}
                </div>

                <div>
                    <Label>Icon</Label>
                    <Input
                        type="text"
                        value={data.icon}
                        onChange={(e) => setData('icon', e.target.value)}
                        placeholder="Icon name or URL"
                    />
                    {errors.icon && <div className="text-red-500 text-sm">{errors.icon}</div>}
                </div>

                <div>
                    <Label>App Link</Label>
                    <Input
                        type="url"
                        value={data.app_link}
                        onChange={(e) => setData('app_link', e.target.value)}
                        placeholder="https://example.com"
                    />
                    {errors.app_link && <div className="text-red-500 text-sm">{errors.app_link}</div>}
                </div>

                <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                        <input
                            id="edit-sso-enabled"
                            type="checkbox"
                            checked={data.sso_enabled}
                            onChange={(e) => setData('sso_enabled', e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                        />
                        <div className="space-y-1">
                            <Label htmlFor="edit-sso-enabled">Enable SSO</Label>
                            <p className="text-sm text-slate-500">
                                Kosongkan client secret jika tidak ingin mengganti secret lama.
                            </p>
                        </div>
                    </div>

                    <div>
                        <Label>SSO Client ID</Label>
                        <Input
                            type="text"
                            value={data.sso_client_id}
                            onChange={(e) => setData('sso_client_id', e.target.value)}
                            placeholder="payroll-local"
                            disabled={!data.sso_enabled}
                        />
                        {errors.sso_client_id && <div className="text-red-500 text-sm">{errors.sso_client_id}</div>}
                    </div>

                    <div>
                        <Label>SSO Redirect URI</Label>
                        <Input
                            type="url"
                            value={data.sso_redirect_uri}
                            onChange={(e) => setData('sso_redirect_uri', e.target.value)}
                            placeholder="http://localhost:8001/sso/callback"
                            disabled={!data.sso_enabled}
                        />
                        {errors.sso_redirect_uri && <div className="text-red-500 text-sm">{errors.sso_redirect_uri}</div>}
                    </div>

                    <div>
                        <Label>New SSO Client Secret</Label>
                        <Input
                            type="text"
                            value={data.sso_client_secret}
                            onChange={(e) => setData('sso_client_secret', e.target.value)}
                            placeholder="Isi hanya jika ingin ganti secret"
                            disabled={!data.sso_enabled}
                        />
                        {errors.sso_client_secret && <div className="text-red-500 text-sm">{errors.sso_client_secret}</div>}
                    </div>
                </div>

                <div>
                    <Label>Divisions</Label>
                    <MultiSelector
                        options={divisions}
                        selected={data.division_ids}
                        onChange={(ids) => setData('division_ids', ids)}
                        placeholder="Select divisions..."
                    />
                    {errors.division_ids && <div className="text-red-500 text-sm">{errors.division_ids}</div>}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={processing}>
                        Update
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
