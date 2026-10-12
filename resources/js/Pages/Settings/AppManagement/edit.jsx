import { useForm } from '@inertiajs/react'
import React from 'react'
import { Button, Modal } from '@/Components/hr/ui'
import AppFormFields from './form-fields'

const fromApp = (app) => ({
    name: app?.name || '', slug: app?.slug || '', description: app?.description || '', icon: app?.icon || '', app_link: app?.app_link || '',
    sso_enabled: Boolean(app?.sso_enabled), sso_client_id: app?.sso_client_id || '', sso_redirect_uri: app?.sso_redirect_uri || '',
    sso_client_secret: '', division_ids: app?.divisions?.map((d) => d.id) || [],
})

export default function Edit({ open, setOpen, app }) {
<<<<<<< HEAD
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm(fromApp(app))
    React.useEffect(() => { if (app) { setData(fromApp(app)); clearErrors() } }, [app])
    const handleClose = () => { setOpen(false); reset(); clearErrors() }
    const submit = (e) => { e?.preventDefault(); put(route('settings.apps.update', app.id), { onSuccess: () => handleClose() }) }
    return (
        <Modal open={open} onClose={handleClose} title="Edit App" size="lg"
            footer={<><Button variant="outline" onClick={handleClose}>Cancel</Button><Button type="submit" form="app-edit-form" loading={processing}>Update</Button></>}>
            <form id="app-edit-form" onSubmit={submit}>
                <AppFormFields data={data} setData={setData} errors={errors} isEdit />
=======
    const { divisions = [] } = usePage().props

    const { data, setData, put, processing, errors, reset } = useForm({
        name: app?.name || '',
        slug: app?.slug || '',
        description: app?.description || '',
        icon: app?.icon || '',
        app_link: app?.app_link || '',
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
>>>>>>> origin/main
            </form>
        </Modal>
    )
}
