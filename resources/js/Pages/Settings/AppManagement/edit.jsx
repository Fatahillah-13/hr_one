import { useForm } from '@inertiajs/react'
import React from 'react'
import { Button, Modal } from '@/Components/hr/ui'
import AppFormFields from './form-fields'

const fromApp = (app) => ({
    name: app?.name || '', slug: app?.slug || '', description: app?.description || '', icon: app?.icon || '', app_link: app?.app_link || '',
    is_active: Boolean(app?.is_active ?? true), division_ids: app?.divisions?.map((d) => d.id) || [],
})

export default function Edit({ open, setOpen, app }) {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm(fromApp(app))
    React.useEffect(() => { if (app) { setData(fromApp(app)); clearErrors() } }, [app])
    const handleClose = () => { setOpen(false); reset(); clearErrors() }
    const submit = (e) => { e?.preventDefault(); put(route('settings.apps.update', app.id), { onSuccess: () => handleClose() }) }
    return (
        <Modal open={open} onClose={handleClose} title="Edit App" size="lg"
            footer={<><Button variant="outline" onClick={handleClose}>Cancel</Button><Button type="submit" form="app-edit-form" loading={processing}>Update</Button></>}>
            <form id="app-edit-form" onSubmit={submit}>
                <AppFormFields data={data} setData={setData} errors={errors} isEdit />
            </form>
        </Modal>
    )
}
