import { router } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import Icon from "@/Components/hr/Icon";
import { AppTile, Badge, appColors } from "@/Components/hr/ui";

// Kartu aplikasi HR One. Perilaku klik sama: link http(s) dibuka di tab baru, modul internal di tab yang sama.
export function openApp(href) {
    if (!href) return;
    if (href.startsWith("http://") || href.startsWith("https://")) {
        window.open(href, "_blank", "noopener,noreferrer");
    } else {
        router.visit(href);
    }
}

export default function AppCard({ app = {}, title = "Nama App", division = "HRD", description = "", href = "/", className, delay = 0, compact = false }) {
    const [c1] = appColors(app.slug ? app : { name: title });
    const divisions = Array.isArray(app.divisions) && app.divisions.length ? app.divisions.map((d) => d.name) : String(division || "-").split(", ");
    const tileApp = { ...app, name: app.name || title };

    if (compact) {
        return (
            <button type="button" onClick={() => openApp(href)} style={{ animationDelay: `${delay}s` }}
                className={cn("hx-card-in group flex w-full items-center gap-3 rounded-[18px] border border-[#E7EAF3] bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(12,26,75,.05),0_8px_24px_-16px_rgba(12,26,75,.25)] transition duration-300 hover:-translate-y-1 hover:border-[#C7D2FE]", className)}>
                <AppTile app={tileApp} />
                <span className="min-w-0 flex-1"><b className="block truncate text-[14.5px] text-[#27272E]">{title}</b><small className="block truncate text-xs text-slate-500">{divisions.join(", ")}</small></span>
                <span className="inline-flex -translate-x-1.5 items-center gap-1 text-xs font-extrabold text-[#2F4BD8] opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100">Buka<Icon name="arrow" className="h-3.5 w-3.5" /></span>
            </button>
        );
    }

    return (
        <button type="button" onClick={() => openApp(href)} style={{ animationDelay: `${delay}s`, "--c1": c1 }}
            onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`); e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`); }}
            className={cn("hx-card-in group relative isolate flex w-full flex-col items-stretch gap-2.5 overflow-hidden rounded-[20px] border border-[#E7EAF3] bg-white p-[18px] text-left shadow-[0_1px_2px_rgba(12,26,75,.05),0_8px_24px_-16px_rgba(12,26,75,.25)] transition duration-300 hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--c1)_35%,#E7EAF3)] hover:shadow-[0_24px_40px_-22px_color-mix(in_srgb,var(--c1)_70%,transparent)] active:-translate-y-0.5 active:scale-[.99]", className)}>
            <span className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "radial-gradient(400px circle at var(--mx,50%) var(--my,0%), color-mix(in srgb, var(--c1) 12%, transparent), transparent 45%)" }} />
            <span className="flex items-start justify-between">
                <AppTile app={tileApp} />
                <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#F1F3F9] text-slate-500 transition duration-300 group-hover:-rotate-45 group-hover:bg-[var(--c1)] group-hover:text-white">
                    <Icon name="arrow" className="h-4 w-4" />
                </span>
            </span>
            <span className="mt-1 text-[16.5px] font-extrabold tracking-tight text-[#27272E]">{title}</span>
            <span className="flex-1 text-[13.5px] leading-relaxed text-[#425466]">{description}</span>
            <span className="mt-1 flex flex-wrap gap-1.5">
                {divisions.map((d) => <Badge key={d}>{d}</Badge>)}
                {app.sso_enabled ? <Badge className="bg-emerald-50 text-emerald-700"><Icon name="shield" className="h-3 w-3" />SSO</Badge> : null}
            </span>
        </button>
    );
}
