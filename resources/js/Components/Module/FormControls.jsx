import { ChevronDown, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function SearchInput({ value, onChange, placeholder = "Cari...", className }) {
    return (
        <label className={cn("group relative block", className)}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#4C6FFF]" />
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-10 w-full rounded-xl border-0 bg-slate-50 pl-10 pr-9 text-sm text-slate-800 ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#4C6FFF]/60 [&::-webkit-search-cancel-button]:hidden"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                    aria-label="Hapus pencarian"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </label>
    );
}

/** Select native bergaya HR One. options: [{ value, label }] */
export function SelectField({ value, onChange, options = [], placeholder = "Semua", label, className }) {
    return (
        <label className={cn("relative block", className)}>
            {label && <span className="sr-only">{label}</span>}
            <select
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "h-10 w-full appearance-none truncate rounded-xl border-0 bg-slate-50 pl-3.5 pr-9 text-sm ring-1 ring-inset ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-[#4C6FFF]/60",
                    value ? "font-medium text-slate-800" : "text-slate-500",
                )}
                title={label}
            >
                <option value="">{placeholder}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </label>
    );
}

/** Pilihan tombol berderet dengan indikator yang bergeser halus. */
export function SegmentedControl({ value, onChange, options, layoutId = "segmented" }) {
    return (
        <div className="inline-flex h-10 items-center rounded-xl bg-slate-100 p-1">
            {options.map((o) => {
                const active = (value ?? "") === o.value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => onChange(o.value)}
                        className={cn(
                            "relative h-8 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors",
                            active ? "text-[#27272E]" : "text-slate-500 hover:text-slate-700",
                        )}
                        aria-pressed={active}
                    >
                        {active && (
                            <motion.span
                                layoutId={layoutId}
                                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                            />
                        )}
                        <span className="relative">{o.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
