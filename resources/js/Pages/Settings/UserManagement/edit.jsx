import { router } from '@inertiajs/react'
import Form from './form'

export default function Edit({ user, roles, divisions }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Edit User</h1>

      <Form
        user={user}
        roles={roles}
        divisions={divisions}
        submitLabel="Update User"
        onSubmit={(data) => router.put(route('users.update', user.id), data)}
      />
    </div>
  )
}
