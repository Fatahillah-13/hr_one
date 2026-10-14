import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import AppCard from "@/Components/ui/app-card";
import Icon from "@/Components/hr/Icon";

// Daftar aplikasi per tab divisi (sama seperti sebelumnya), dengan penanda tab yang bergeser.
export default function AppsList({ title = "Aplikasi", tabs: tabsProp, apps = [], divisions = [], className, cardClassName }) {
    const tabs = useMemo(() => tabsProp || divisions.map((d) => ({ id: d.id, label: d.name })), [tabsProp, divisions]);
    const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? null);
    const bar = useRef(null);
    const [ind, setInd] = useState({ x: 0, w: 0, ready: false });

    useEffect(() => { if (!tabs.some((t) => t.id === activeTab)) setActiveTab(tabs[0]?.id ?? null); }, [tabs, activeTab]);
    useLayoutEffect(() => {
        const el = bar.current?.querySelector(`[data-tab="${activeTab}"]`);
        if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
    }, [activeTab, tabs]);

    const filteredApps = useMemo(() => apps.filter((app) => app.divisions?.some((d) => d.id === activeTab)), [activeTab, apps]);
    const count = (id) => apps.filter((a) => a.divisions?.some((d) => d.id === id)).length;

    return (
        <section className={cn("w-full min-w-0", className)}>
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-extrabold tracking-tight text-[#27272E]">{title}</h2>
                    <span className="rounded-full border border-[#E7EAF3] bg-white px-2.5 py-0.5 text-[12.5px] font-bold text-slate-500">{filteredApps.length} aplikasi</span>
                </div>
                <div ref={bar} role="tablist" aria-label="Kategori aplikasi"
                    className="hx-scroll-none relative flex w-max max-w-full gap-1 overflow-x-auto rounded-2xl border border-[#E7EAF3] bg-white p-[5px]">
                    <span className={cn("absolute bottom-[5px] left-0 top-[5px] rounded-xl bg-gradient-to-br from-[#4C6FFF] to-[#2F4BD8] shadow-[0_8px_18px_-10px_rgba(47,75,216,.9)]", ind.ready && "transition-[transform,width] duration-300 [transition-timing-function:cubic-bezier(.22,1,.36,1)]")}
                        style={{ transform: `translateX(${ind.x}px)`, width: ind.w }} />
                    {tabs.map((tab) => {
                        const on = activeTab === tab.id;
                        return (
                            <button key={tab.id} data-tab={tab.id} type="button" role="tab" aria-selected={on} onClick={() => setActiveTab(tab.id)}
                                className={cn("relative z-[1] inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-bold transition-colors", on ? "text-white" : "text-slate-500 hover:text-[#27272E]")}>
                                <Icon name="grid" className="h-[17px] w-[17px]" />{tab.label}
                                <i className={cn("min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-extrabold not-italic transition-colors", on ? "bg-white/25 text-white" : "bg-[#F1F3F9] text-slate-500")}>{count(tab.id)}</i>
                            </button>
                        );
                    })}
                </div>
                <div role="tabpanel" className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-[18px] xl:grid-cols-4">
                    {filteredApps.length > 0 ? filteredApps.map((app, index) => (
                        <AppCard key={`${activeTab}-${app.id ?? index}`} app={app} title={app.name} description={app.description || ""}
                            href={app.launch_url} delay={index * 0.05} className={cardClassName} />
                    )) : (
                        <div className="hx-up col-span-full grid justify-items-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed border-[#D5DBEA] bg-white px-4 py-9 text-center text-[13.5px] text-slate-500">
                            <Icon name="grid" className="mb-1 h-8 w-8 text-slate-400" />
                            <b className="text-[15px] text-[#27272E]">Belum ada aplikasi pada kategori ini.</b>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
