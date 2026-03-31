import { router } from '@inertiajs/react'
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
import { MoreHorizontalIcon } from "lucide-react"
import Create from './create'

export default function Index({ users, roles = [], divisions = [] }) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)

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
                <Button
                    onClick={() => {
                        setSelectedUser(null)
                        setIsSheetOpen(true)
                    }}
                >
                    Tambah User
                </Button>
            </div>

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
        </div>
    )
}
