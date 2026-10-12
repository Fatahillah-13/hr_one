import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

function pageWindow(current, last) {
    const pages = new Set([1, last, current, current - 1, current + 1]);
    const list = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
    const out = [];
    list.forEach((p, i) => {
        if (i > 0 && p - list[i - 1] > 1) out.push("…" + p);
        out.push(p);
    });
    return out;
}

/**
 * Pagination untuk paginator Laravel.
 * meta: { current_page, last_page, from, to, total }
 */
export default function Pagination({ meta, onPage, perPage, perPageOptions = [], onPerPage }) {
    const { current_page: current, last_page: last, from, to, total } = meta;
    const [jump, setJump] = useState(current);

    useEffect(() => setJump(current), [current]);

    const btn =
        "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition disabled:pointer-events-none disabled:opacity-40";

    return (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
                <span>
                    {total > 0 ? (
                        <>
                            Menampilkan <b className="text-slate-700">{formatNumber(from)}–{formatNumber(to)}</b> dari{" "}
                            <b className="text-slate-700">{formatNumber(total)}</b>
                        </>
                    ) : (
                        "Tidak ada data"
                    )}
                </span>
                {perPageOptions.length > 0 && (
                    <select
                        value={perPage}
                        onChange={(e) => onPerPage(Number(e.target.value))}
                        className="h-8 rounded-lg border-0 bg-slate-50 py-0 pl-2 pr-7 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[#4C6FFF]/60"
                        aria-label="Jumlah per halaman"
                    >
                        {perPageOptions.map((n) => (
                            <option key={n} value={n}>
                                {n} / hal
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {last > 1 && (
                <div className="flex items-center gap-1">
                    <button className={cn(btn, "hover:bg-slate-100")} disabled={current === 1} onClick={() => onPage(1)} aria-label="Halaman pertama">
                        <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button className={cn(btn, "hover:bg-slate-100")} disabled={current === 1} onClick={() => onPage(current - 1)} aria-label="Sebelumnya">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="hidden items-center gap-1 sm:flex">
                        {pageWindow(current, last).map((p) =>
                            typeof p === "string" ? (
                                <span key={p} className="px-1 text-slate-400">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => onPage(p)}
                                    className={cn(
                                        btn,
                                        p === current
                                            ? "bg-[#4C6FFF] text-white shadow-[0_4px_12px_-4px_rgba(76,111,255,0.8)]"
                                            : "text-slate-600 hover:bg-slate-100",
                                    )}
                                    aria-current={p === current ? "page" : undefined}
                                >
                                    {p}
                                </button>
                            ),
                        )}
                    </div>
                    <form
                        className="flex items-center gap-1 sm:hidden"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const n = Math.min(Math.max(Number(jump) || 1, 1), last);
                            onPage(n);
                        }}
                    >
                        <input
                            type="number"
                            min={1}
                            max={last}
                            value={jump}
                            onChange={(e) => setJump(e.target.value)}
                            className="h-8 w-14 rounded-lg border-0 bg-slate-50 px-2 text-center text-xs font-semibold ring-1 ring-inset ring-slate-200"
                            aria-label="Ke halaman"
                        />
                        <span className="text-xs">/ {last}</span>
                    </form>
                    <button className={cn(btn, "hover:bg-slate-100")} disabled={current === last} onClick={() => onPage(current + 1)} aria-label="Berikutnya">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button className={cn(btn, "hover:bg-slate-100")} disabled={current === last} onClick={() => onPage(last)} aria-label="Halaman terakhir">
                        <ChevronsRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
