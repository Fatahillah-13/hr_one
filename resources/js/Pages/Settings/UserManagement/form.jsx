import { useForm } from '@inertiajs/react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
                <Label>Nama</Label>
                <Input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
            </div>

            <div>
                <Label>Username</Label>
                <Input
                    type="text"
                    value={data.username}
                    onChange={(e) => setData('username', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.username && <div className="text-red-500 text-sm">{errors.username}</div>}
            </div>

            <div>
                <Label>Email</Label>
                <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
            </div>

            <div>
                <Label>Password {user ? '(kosongkan jika tidak diubah)' : ''}</Label>
                <Input
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.password && <div className="text-red-500 text-sm">{errors.password}</div>}
            </div>

            <div>
                <Label>Role</Label>
                <Select
                    value={String(data.role_id)}
                    onValueChange={(value) => setData('role_id', value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {roles.map((role) => (
                                <SelectItem key={role.id} value={String(role.id)}>
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                {errors.role_id && <div className="text-red-500 text-sm">{errors.role_id}</div>}
            </div>

            <div>
                <Label>Division</Label>
                <Select
                    value={String(data.division_id)}
                    onValueChange={(value) => setData('division_id', value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih division" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {divisions.map((division) => (
                                <SelectItem key={division.id} value={String(division.id)}>
                                    {division.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                {errors.division_id && <div className="text-red-500 text-sm">{errors.division_id}</div>}
            </div>

            <div>
                <Label>Status</Label>
                <Select
                    value={data.is_active ? '1' : '0'}
                    onValueChange={(value) => setData('is_active', value === '1')}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="1">Aktif</SelectItem>
                            <SelectItem value="0">Nonaktif</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
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
