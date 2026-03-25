import { Link, router } from '@inertiajs/react'

export default function Index({ users }) {
    const handleDelete = (id) => {
        if (confirm('Yakin hapus user ini?')) {
            router.delete(route('users.destroy', id))
        }
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">User Management</h1>
                <Link
                    href={route('users.create')}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                >
                    Tambah User
                </Link>
            </div>

            <div className="overflow-x-auto bg-white rounded shadow">
                <table className="w-full">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="p-3">Nama</th>
                            <th className="p-3">Username</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Division</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.data.map((user) => (
                            <tr key={user.id} className="border-b">
                                <td className="p-3">{user.name}</td>
                                <td className="p-3">{user.username}</td>
                                <td className="p-3">{user.email}</td>
                                <td className="p-3">{user.role?.name ?? '-'}</td>
                                <td className="p-3">{user.division?.name ?? '-'}</td>
                                <td className="p-3">{user.is_active ? 'Aktif' : 'Nonaktif'}</td>
                                <td className="p-3 space-x-2">
                                    <Link
                                        href={route('users.edit', user.id)}
                                        className="text-blue-600"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="text-red-600"
                                    >
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
