import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { PageHero, Panel } from '@/Components/hr/ui'
import Form from './form'

export default function Edit({ user, roles, divisions }) {
    const [errors, setErrors] = useState({})
    const [processing, setProcessing] = useState(false)
    return (
        <AuthenticatedLayout>
            <Head title="Edit User" />
            <PageHero icon="user" title="Edit User" subtitle={user?.name} crumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Settings', href: '/settings?tab=users' }, { label: 'Edit User' }]} />
            <div className="mx-auto max-w-xl px-4 py-5">
                <Panel>
                    <Form user={user} roles={roles} divisions={divisions} submitLabel="Update User" errors={errors} processing={processing}
                        onSubmit={(data) => router.put(route('users.update', user.id), data, { onStart: () => setProcessing(true), onFinish: () => setProcessing(false), onError: setErrors })} />
                </Panel>
            </div>
        </AuthenticatedLayout>
    )
}
