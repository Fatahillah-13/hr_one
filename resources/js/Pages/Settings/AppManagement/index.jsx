import { router } from '@inertiajs/react'
import { useState } from 'react'
import Button from "@/Components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table"
import { MoreHorizontalIcon } from "lucide-react"
import Create from './create'
import Edit from './edit'

export default function AppManagement({ apps }) {
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [editingApp, setEditingApp] = useState(null)

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this app?')) {
            router.delete(route('settings.apps.destroy', id))
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">App Management</h1>
                <Button onClick={() => setOpen(true)}>Create New App</Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <tableHead>Division</tableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {apps.map((app) => (
                        <TableRow key={app.id}>
                            <TableCell>{app.name}</TableCell>
                            <TableCell>{app.divisions.map(d => d.name).join(', ')}</TableCell>
                            <TableCell>{app.app_link}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontalIcon />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => {
                                            setEditingApp(app)
                                            setEditOpen(true)
                                        }}>
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDelete(app.id)}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Create open={open} setOpen={setOpen} />
            {editingApp && <Edit open={editOpen} setOpen={setEditOpen} app={editingApp} />}
        </div>
    )
}
