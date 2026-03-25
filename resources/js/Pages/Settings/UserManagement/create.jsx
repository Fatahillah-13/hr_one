import { router } from '@inertiajs/react'
import Form from './form'

export default function Create({ roles, divisions }) {
    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">Tambah User</h1>

            <Form
                roles={roles}
                divisions={divisions}
                submitLabel="Buat User"
                onSubmit={(data) => router.post(route('users.store'), data)}
            />
        </div>
    )
}
