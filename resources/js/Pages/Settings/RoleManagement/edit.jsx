import { useForm } from '@inertiajs/react'
import React from 'react'
import { Button, Modal } from '@/Components/hr/ui'
import RoleFormFields from './form-fields'

export default function Edit({ open, setOpen, role, apps = [] }) {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        name: role?.name || '',
        app_ids: role?.apps ? role.apps.map((a) => a.id) : [],
    })

    React.useEffect(() => {
        if (role) {
            setData({
                name: role.name || '',
                app_ids: role.apps ? role.apps.map((a) => a.id) : [],
            })
            clearErrors()
        }
    }, [role])

    const handleClose = () => {
        setOpen(false)
        reset()
        clearErrors()
    }

    const submit = (e) => {
        e?.preventDefault()
        put(route('settings.roles.update', role.id), {
            preserveScroll: true,
            onSuccess: () => handleClose(),
        })
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={role ? `Edit Role: ${role.name}` : 'Edit Role'}
            size="lg"
            footer={
                <>
                    <Button variant="outline" onClick={handleClose}>
                        Batal
                    </Button>
                    <Button type="submit" form="role-edit-form" loading={processing}>
                        Simpan Perubahan
                    </Button>
                </>
            }
        >
            <form id="role-edit-form" onSubmit={submit}>
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
