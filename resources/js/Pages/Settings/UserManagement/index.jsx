import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import Button from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoreHorizontalIcon, UploadIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import Create from './create'
import ImportUsers from './import'

export default function Index({ users, roles = [], divisions = [] }) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const { flash } = usePage().props

    const handleDelete = (id) => {
        if (confirm('Yakin hapus user ini?')) {
            router.delete(route('users.destroy', id))
        }
    }

    const handleEdit = (user) => {
        setSelectedUser({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role_id: user.role?.id ?? '',
            division_id: user.division?.id ?? '',
            is_active: user.is_active,
        })
        setIsSheetOpen(true)
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">User Management</h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsImportOpen(true)}
                    >
                        <UploadIcon className="size-4 mr-2" />
                        Import Excel
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedUser(null)
                            setIsSheetOpen(true)
                        }}
                    >
                        Tambah User
                    </Button>
                </div>
            </div>

            {flash?.success && (
                <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}

            {flash?.import_errors && flash.import_errors.length > 0 && (
                <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
                    <p className="font-medium mb-1">Beberapa baris gagal diimport:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {flash.import_errors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="overflow-x-auto bg-white rounded shadow">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow className="text-left border-b">
                            <TableHead className="p-3">Nama</TableHead>
                            <TableHead className="p-3">Username</TableHead>
                            <TableHead className="p-3">Email</TableHead>
                            <TableHead className="p-3">Role</TableHead>
                            <TableHead className="p-3">Division</TableHead>
                            <TableHead className="p-3">Status</TableHead>
                            <TableHead className="p-3">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.data.map((user) => (
                            <TableRow key={user.id} className="border-b">
                                <TableCell className="p-3">{user.name}</TableCell>
                                <TableCell className="p-3">{user.username}</TableCell>
                                <TableCell className="p-3">{user.email}</TableCell>
                                <TableCell className="p-3">{user.role?.name ?? '-'}</TableCell>
                                <TableCell className="p-3">{user.division?.name ?? '-'}</TableCell>
                                <TableCell className="p-3">{user.is_active ? 'Aktif' : 'Nonaktif'}</TableCell>
                                <TableCell className="p-3 space-x-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8">
                                                <MoreHorizontalIcon />
                                                <span className="sr-only">Open menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(user)}>Edit</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {users.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600">
                        Menampilkan {users.from}–{users.to} dari {users.total} user
                    </p>
                    <div className="flex items-center gap-1">
                        {users.links.map((link, i) => {
                            const goToPage = () => {
                                if (!link.url) return
                                const url = new URL(link.url)
                                const page = url.searchParams.get('page') || 1
                                router.get(route('settings'), { page, tab: 'users' }, { preserveState: true })
                            }
                            if (link.label.includes('Previous')) {
                                return (
                                    <Button
                                        key={i}
                                        variant="outline"
                                        size="icon"
                                        className="size-8"
                                        disabled={!link.url}
                                        onClick={goToPage}
                                    >
                                        <ChevronLeftIcon className="size-4" />
                                    </Button>
                                )
                            }
                            if (link.label.includes('Next')) {
                                return (
                                    <Button
                                        key={i}
                                        variant="outline"
                                        size="icon"
                                        className="size-8"
                                        disabled={!link.url}
                                        onClick={goToPage}
                                    >
                                        <ChevronRightIcon className="size-4" />
                                    </Button>
                                )
                            }
                            return (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="icon"
                                    className="size-8"
                                    disabled={!link.url}
                                    onClick={goToPage}
                                >
                                    {link.label}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            )}

            <Create
                open={isSheetOpen}
                onOpenChange={(open) => {
                    setIsSheetOpen(open)
                    if (!open) {
                        setSelectedUser(null)
                    }
                }}
                user={selectedUser}
                roles={roles}
                divisions={divisions}
            />

            <ImportUsers
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
            />
        </div>
    )
}
