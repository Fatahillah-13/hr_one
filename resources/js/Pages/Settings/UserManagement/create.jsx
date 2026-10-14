import { router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { Sheet } from '@/Components/hr/ui'
import Form from './form'

// Panel Tambah / Edit user (sama seperti sebelumnya, kini pesan validasi dari server ikut tampil).
export default function Create({ open = false, onOpenChange, user = null, roles = [], divisions = [] }) {
    const isEdit = Boolean(user?.id)
    const [errors, setErrors] = useState({})
    const [processing, setProcessing] = useState(false)
    useEffect(() => { if (open) setErrors({}) }, [open, user?.id])
    const opts = { preserveScroll: true, onStart: () => setProcessing(true), onFinish: () => setProcessing(false), onError: (e) => setErrors(e), onSuccess: () => onOpenChange?.(false) }
    const handleSubmit = (data) => {
        if (isEdit) router.put(route('users.update', user.id), data, opts)
        else router.post(route('users.store'), data, opts)
    }
    return (
        <Sheet open={open} onClose={() => onOpenChange?.(false)} side="right" title={isEdit ? 'Edit User' : 'Tambah User'}
            description={isEdit ? 'Perbarui data user di bawah ini.' : 'Isi data user baru di bawah ini.'}>
            <Form user={user} roles={roles} divisions={divisions} submitLabel={isEdit ? 'Update User' : 'Buat User'} onSubmit={handleSubmit} errors={errors} processing={processing} />
        </Sheet>
    )
}
