import { useForm } from '@inertiajs/react'
import { useRef, useState } from 'react'
import { Button, Sheet } from '@/Components/hr/ui'
import Icon from '@/Components/hr/Icon'
import { cn } from '@/lib/utils'

// Import user dari Excel/CSV (sama seperti sebelumnya) dengan area tarik-lepas file.
export default function ImportUsers({ open = false, onOpenChange }) {
    const fileInputRef = useRef(null)
    const [over, setOver] = useState(false)
    const { data, setData, post, processing, errors, reset } = useForm({ file: null })
    const close = () => { reset(); onOpenChange?.(false) }
    const handleSubmit = (e) => { e.preventDefault(); post(route('users.import'), { forceFormData: true, onSuccess: () => { reset(); onOpenChange?.(false) } }) }
    const pick = (f) => setData('file', f || null)
    return (
        <Sheet open={open} onClose={close} side="left" title="Import User dari Excel" description="Upload file Excel (.xlsx, .xls) atau CSV untuk import user secara massal.">
            <div className="grid gap-4">
                <div className="flex gap-2.5 rounded-xl bg-[#EEF2FF] px-3.5 py-3 text-[13px] font-semibold text-[#2F4BD8]"><Icon name="alert" className="h-4 w-4 shrink-0" />Download template terlebih dahulu untuk memastikan format yang benar.</div>
                <Button as="a" variant="outline" href={route('users.download-template')} className="w-full"><Icon name="download" className="h-4 w-4" />Download Template CSV</Button>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <label htmlFor="import-file"
                        onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
                        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]) }}
                        className={cn('relative grid cursor-pointer justify-items-center gap-1 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition',
                            data.file ? 'border-green-300 bg-green-50 text-green-700' : over ? 'scale-[1.01] border-[#4C6FFF] bg-[#EEF2FF] text-[#2F4BD8]' : 'border-indigo-200 bg-[#FAFBFF] text-[#2F4BD8] hover:border-[#4C6FFF] hover:bg-[#EEF2FF]')}>
                        <input id="import-file" ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={(e) => pick(e.target.files[0])} />
                        <Icon name={data.file ? 'file' : 'upload'} className="h-7 w-7" />
                        <b className="break-all text-sm">{data.file ? data.file.name : 'Pilih file atau tarik ke sini'}</b>
                        <small className="text-slate-500">File Excel / CSV · maks 2 MB</small>
                    </label>
                    {errors.file && <p className="text-xs font-semibold text-rose-600">{errors.file}</p>}
                    <div className="rounded-xl bg-[#F1F3F9] px-4 py-3 text-[13px] text-[#425466]">
                        <p className="font-semibold">Format kolom yang diharapkan:</p>
                        <ul className="mt-1.5 grid gap-1 pl-4 [list-style:disc]">
                            <li><b className="font-mono text-xs">name</b> - Nama lengkap (wajib)</li>
                            <li><b className="font-mono text-xs">username</b> - Username unik (wajib)</li>
                            <li><b className="font-mono text-xs">email</b> - Email unik (wajib)</li>
                            <li><b className="font-mono text-xs">password</b> - Password min 8 karakter (wajib)</li>
                            <li><b className="font-mono text-xs">role</b> - Nama role (opsional)</li>
                            <li><b className="font-mono text-xs">division</b> - Nama divisi (opsional)</li>
                            <li><b className="font-mono text-xs">status</b> - "aktif" atau "nonaktif" (opsional, default: aktif)</li>
                        </ul>
                    </div>
                    <Button type="submit" disabled={!data.file} loading={processing} className="w-full"><Icon name="upload" className="h-4 w-4" />{processing ? 'Mengimport...' : 'Import User'}</Button>
                </form>
            </div>
        </Sheet>
    )
}
