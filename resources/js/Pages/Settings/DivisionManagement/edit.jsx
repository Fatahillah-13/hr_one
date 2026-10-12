import { useForm } from '@inertiajs/react'
import React from 'react'
import { Button, Modal } from '@/Components/hr/ui'
import DivisionFormFields from './form-fields'

const fromDivision = (division) => ({
    name: division?.name || '',
    slug: division?.slug || '',
    sort_order: division?.sort_order ?? '',
})

export default function Edit({ open, setOpen, division }) {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm(fromDivision(division))

    React.useEffect(() => {
        if (division) {
            setData(fromDivision(division))
            clearErrors()
        }
    }, [division])

    const handleClose = () => {
        setOpen(false)
        reset()
        clearErrors()
    }

    const submit = (e) => {
        e?.preventDefault()
        put(route('settings.divisions.update', division.id), {
            preserveScroll: true,
            onSuccess: () => handleClose(),
        })
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Edit Menu Kategori"
            size="md"
            footer={
                <>
                    <Button variant="outline" onClick={handleClose}>
                        Batal
                    </Button>
                    <Button type="submit" form="division-edit-form" loading={processing}>
                        Simpan Perubahan
                    </Button>
                </>
            }
        >
            <form id="division-edit-form" onSubmit={submit}>
                <DivisionFormFields
                    data={data}
                    setData={setData}
                    errors={errors}
                    isEdit
                />
            </form>
        </Modal>
    )
}
