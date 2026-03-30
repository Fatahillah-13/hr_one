import { router } from '@inertiajs/react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import Form from './form'

export default function Create({ open = false, onOpenChange, user = null, roles = [], divisions = [] }) {
    const isEdit = Boolean(user?.id)

    const handleSubmit = (data) => {
        if (isEdit) {
            router.put(route('users.update', user.id), data, {
                onSuccess: () => onOpenChange?.(false),
            })
            return
        }

        router.post(route('users.store'), data, {
            onSuccess: () => onOpenChange?.(false),
        })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="flex h-full w-full flex-col p-0 sm:max-w-xl data-[side=bottom]:max-h-[50vh] data-[side=top]:max-h-[50vh]"
            >
                <SheetHeader className="px-6 pt-4">
                    <SheetTitle>{isEdit ? 'Edit User' : 'Tambah User'}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? 'Perbarui data user di bawah ini.' : 'Isi data user baru di bawah ini.'}
                    </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                    <div className="pt-6">
                        <Form
                            user={user}
                            roles={roles}
                            divisions={divisions}
                            submitLabel={isEdit ? 'Update User' : 'Buat User'}
                            onSubmit={handleSubmit}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
