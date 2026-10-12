import { Field, inputCls } from '@/Components/hr/ui'
import Icon from '@/Components/hr/Icon'

export default function DivisionFormFields({ data, setData, errors, isEdit, slugTouched, setSlugTouched }) {
    const onName = (v) => {
        setData((d) => ({
            ...d,
            name: v,
            ...(!isEdit && !slugTouched ? { slug: v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {})
        }))
    }

    return (
        <div className="grid gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[#F4F6FB] p-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#2F4BD8] shadow-sm">
                    <Icon name="grid" className="h-5 w-5" />
                </div>
                <div className="min-w-0 text-sm">
                    <b className="block truncate text-[#27272E]">{data.name || 'Nama Menu Kategori'}</b>
                    <span className="text-xs text-slate-500 font-mono">{data.slug || 'slug-kategori'} &bull; Pratinjau tab menu</span>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Category Name" htmlFor="division-name" error={errors.name} className="sm:col-span-2">
                    <input
                        id="division-name"
                        className={inputCls}
                        value={data.name}
                        onChange={(e) => onName(e.target.value)}
                        placeholder="Contoh: Recruitment, 3rd Party"
                        required
                    />
                </Field>
                <Field label="Nomor Urutan" htmlFor="division-sort-order" error={errors.sort_order}>
                    <input
                        id="division-sort-order"
                        type="number"
                        min="1"
                        className={inputCls}
                        value={data.sort_order ?? ''}
                        onChange={(e) => setData('sort_order', e.target.value)}
                        placeholder="Contoh: 1, 2, ..."
                    />
                </Field>
            </div>
            <div>
                <Field label="Slug" htmlFor="division-slug" error={errors.slug}>
                    <input
                        id="division-slug"
                        className={inputCls}
                        value={data.slug}
                        onChange={(e) => {
                            setSlugTouched?.(true)
                            setData('slug', e.target.value)
                        }}
                        placeholder="contoh: recruitment, 3rd-party"
                    />
                </Field>
            </div>
            <p className="text-xs text-slate-500">
                Menu ini akan muncul sebagai tab kategori di bilah navigasi Beranda HR One apabila memiliki aplikasi yang terhubung.
            </p>
        </div>
    )
}
