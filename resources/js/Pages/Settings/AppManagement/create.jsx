import { useForm } from '@inertiajs/react'
import { useState } from 'react'
import { Button, Modal } from '@/Components/hr/ui'
import AppFormFields from './form-fields'

export default function Create({ open, setOpen }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '', slug: '', description: '', icon: '', app_link: '', is_active: true,
        sso_enabled: false, sso_client_id: '', sso_redirect_uri: '', sso_client_secret: '', division_ids: [],
    })
    const [slugTouched, setSlugTouched] = useState(false)
    const handleClose = () => { setOpen(false); reset(); clearErrors(); setSlugTouched(false) }
    const submit = (e) => { e?.preventDefault(); post(route('settings.apps.store'), { onSuccess: () => handleClose() }) }
    return (
        <Modal open={open} onClose={handleClose} title="Create New App" size="lg"
            footer={<><Button variant="outline" onClick={handleClose}>Cancel</Button><Button type="submit" form="app-create-form" loading={processing}>Create</Button></>}>
            <form id="app-create-form" onSubmit={submit}>
                <AppFormFields data={data} setData={setData} errors={errors} slugTouched={slugTouched} setSlugTouched={setSlugTouched} />
            </form>
        </Modal>
    )
}
