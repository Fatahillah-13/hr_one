import { useForm } from '@inertiajs/react'
import { useState } from 'react'
import { Button, Modal } from '@/Components/hr/ui'
import DivisionFormFields from './form-fields'

export default function Create({ open, setOpen }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        slug: '',
        sort_order: '',
    })
    const [slugTouched, setSlugTouched] = useState(false)

    const handleClose = () => {
        setOpen(false)
        reset()
        clearErrors()
        setSlugTouched(false)
    }

    const submit = (e) => {
        e?.preventDefault()
        post(route('settings.divisions.store'), {
            preserveScroll: true,
            onSuccess: () => handleClose(),
        })
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Tambah Menu Kategori Baru"
            size="md"
            footer={
                <>
                    <Button variant="outline" onClick={handleClose}>
                        Batal
                    </Button>
                    <Button type="submit" form="division-create-form" loading={processing}>
                        Simpan Kategori
                    </Button>
                </>
            }
        >
            <form id="division-create-form" onSubmit={submit}>
                <DivisionFormFields
                    data={data}
                    setData={setData}
                    errors={errors}
                    slugTouched={slugTouched}
                    setSlugTouched={setSlugTouched}
                />
            </form>
        </Modal>
    )
}
