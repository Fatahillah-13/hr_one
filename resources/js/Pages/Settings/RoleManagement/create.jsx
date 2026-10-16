import { useForm } from '@inertiajs/react'
import { Button, Modal } from '@/Components/hr/ui'
import RoleFormFields from './form-fields'

export default function Create({ open, setOpen, apps = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        app_ids: [],
    })

    const handleClose = () => {
        reset()
        setOpen(false)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        post(route('settings.roles.store'), {
            onSuccess: () => {
                handleClose()
            },
        })
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Tambah Role Baru"
            size="lg"
            footer={
                <>
                    <Button variant="outline" onClick={handleClose} type="button">
                        Batal
                    </Button>
                    <Button type="submit" form="create-role-form" loading={processing}>
                        Simpan Role
                    </Button>
                </>
            }
        >
            <form id="create-role-form" onSubmit={handleSubmit}>
                <RoleFormFields
                    data={data}
                    setData={setData}
                    errors={errors}
                    apps={apps}
                />
            </form>
        </Modal>
    )
}
