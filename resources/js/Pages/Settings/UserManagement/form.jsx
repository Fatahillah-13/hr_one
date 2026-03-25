import { useForm } from '@inertiajs/react'

export default function Form({ user = null, roles = [], divisions = [], submitLabel = 'Simpan', onSubmit }) {
    const { data, setData, processing, errors } = useForm({
        name: user?.name ?? '',
        username: user?.username ?? '',
        email: user?.email ?? '',
        password: '',
        role_id: user?.role_id ?? '',
        division_id: user?.division_id ?? '',
        is_active: user?.is_active ?? true,
    })

    const submit = (e) => {
        e.preventDefault()
        onSubmit(data)
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <label>Nama</label>
                <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
            </div>

            <div>
                <label>Username</label>
                <input
                    type="text"
                    value={data.username}
                    onChange={(e) => setData('username', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.username && <div className="text-red-500 text-sm">{errors.username}</div>}
            </div>

            <div>
                <label>Email</label>
                <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
            </div>

            <div>
                <label>Password {user ? '(kosongkan jika tidak diubah)' : ''}</label>
                <input
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.password && <div className="text-red-500 text-sm">{errors.password}</div>}
            </div>

            <div>
                <label>Role</label>
                <select
                    value={data.role_id}
                    onChange={(e) => setData('role_id', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                >
                    <option value="">Pilih role</option>
                    {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                            {role.name}
                        </option>
                    ))}
                </select>
                {errors.role_id && <div className="text-red-500 text-sm">{errors.role_id}</div>}
            </div>

            <div>
                <label>Division</label>
                <select
                    value={data.division_id}
                    onChange={(e) => setData('division_id', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                >
                    <option value="">Pilih division</option>
                    {divisions.map((division) => (
                        <option key={division.id} value={division.id}>
                            {division.name}
                        </option>
                    ))}
                </select>
                {errors.division_id && <div className="text-red-500 text-sm">{errors.division_id}</div>}
            </div>

            <div>
                <label>Status</label>
                <select
                    value={data.is_active ? '1' : '0'}
                    onChange={(e) => setData('is_active', e.target.value === '1')}
                    className="w-full border rounded px-3 py-2"
                >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                </select>
            </div>

            <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 rounded bg-blue-600 text-white"
            >
                {submitLabel}
            </button>
        </form>
    )
}
