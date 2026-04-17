import { useForm } from '@inertiajs/react'
import { useRef } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Button from "@/components/ui/button"
import { UploadIcon, DownloadIcon } from "lucide-react"

export default function ImportUsers({ open = false, onOpenChange }) {
    const fileInputRef = useRef(null)
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        post(route('users.import'), {
            forceFormData: true,
            onSuccess: () => {
                reset()
                onOpenChange?.(false)
            },
        })
    }

    const handleFileChange = (e) => {
        setData('file', e.target.files[0] || null)
    }

    return (
        <Sheet open={open} onOpenChange={(v) => {
            if (!v) reset()
            onOpenChange?.(v)
        }}>
            <SheetContent
                side="left"
                className="flex h-full w-full flex-col p-0 sm:max-w-xl data-[side=bottom]:max-h-[50vh] data-[side=top]:max-h-[50vh]"
            >
                <SheetHeader className="px-6 pt-4">
                    <SheetTitle>Import User dari Excel</SheetTitle>
                    <SheetDescription>
                        Upload file Excel (.xlsx, .xls) atau CSV untuk import user secara massal.
                    </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                    <div className="pt-6 space-y-6">
                        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                            <p className="text-sm text-gray-600 mb-3">
                                Download template terlebih dahulu untuk memastikan format yang benar.
                            </p>
                            <a
                                href={route('users.download-template')}
                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                                <DownloadIcon className="size-4" />
                                Download Template CSV
                            </a>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>File Excel / CSV</Label>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    className="mt-1"
                                />
                                {errors.file && (
                                    <div className="text-red-500 text-sm mt-1">{errors.file}</div>
                                )}
                            </div>

                            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                                <p className="font-medium mb-2">Format kolom yang diharapkan:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>name</strong> - Nama lengkap (wajib)</li>
                                    <li><strong>username</strong> - Username unik (wajib)</li>
                                    <li><strong>email</strong> - Email unik (wajib)</li>
                                    <li><strong>password</strong> - Password min 8 karakter (wajib)</li>
                                    <li><strong>role</strong> - Nama role (opsional)</li>
                                    <li><strong>division</strong> - Nama divisi (opsional)</li>
                                    <li><strong>status</strong> - "aktif" atau "nonaktif" (opsional, default: aktif)</li>
                                </ul>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing || !data.file}
                                className="w-full"
                            >
                                <UploadIcon className="size-4 mr-2" />
                                {processing ? 'Mengimport...' : 'Import User'}
                            </Button>
                        </form>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
