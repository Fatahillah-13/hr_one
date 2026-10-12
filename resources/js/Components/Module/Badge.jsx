import { cn } from "@/lib/utils";

const TONES = {
    blue: "bg-[#EEF2FF] text-[#3B5BDB] ring-[#C7D2FE]",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    gray: "bg-slate-100 text-slate-600 ring-slate-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
};

const DOTS = {
    blue: "bg-[#4C6FFF]",
    green: "bg-emerald-500",
    red: "bg-rose-500",
    amber: "bg-amber-500",
    gray: "bg-slate-400",
    violet: "bg-violet-500",
};

export default function Badge({ tone = "gray", dot = false, pulse = false, className, children }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                TONES[tone],
                className,
            )}
        >
            {dot && (
                <span className="relative flex h-1.5 w-1.5">
                    {pulse && (
                        <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", DOTS[tone])} />
                    )}
                    <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", DOTS[tone])} />
                </span>
            )}
            {children}
        </span>
    );
}

export function EmployeeStatusBadge({ status }) {
    if (status === "active") {
        return (
            <Badge tone="green" dot pulse>
                Aktif
            </Badge>
        );
    }
    if (status === "notactive") {
        return (
            <Badge tone="gray" dot>
                Tidak aktif
            </Badge>
        );
    }
    return <Badge tone="gray">{status || "—"}</Badge>;
}

const TYPE_TONES = { Permanent: "blue", Contract: "amber", Probation: "violet" };

export function EmployeeTypeBadge({ type }) {
    if (!type) return <span className="text-slate-400">—</span>;
    return <Badge tone={TYPE_TONES[type] ?? "gray"}>{type}</Badge>;
}
