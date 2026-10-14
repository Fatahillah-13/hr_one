import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useLayoutEffect, useRef, useState } from "react";
import IndexUsermanagement from "./UserManagement/index";
import AppIndexManagement from "./AppManagement/index";
import DivisionManagement from "./DivisionManagement/index";
import ItCallSettings from "./ItCall/index";
import Icon from "@/Components/hr/Icon";
import { PageHero, Panel } from "@/Components/hr/ui";
import { cn } from "@/lib/utils";

// Tab: Home (App Management), Categories (Divisions), Users, Messages, IT Call, Settings. ?tab=categories|users|messages|itcall|settings
const TABS = [
    { key: "home", title: "Home", icon: "home" },
    { key: "categories", title: "Kategori Menu", icon: "grid" }, "|",
    { key: "users", title: "Users", icon: "users" }, { key: "messages", title: "Messages", icon: "mail" }, { key: "itcall", title: "IT Call", icon: "headset" }, "|",
    { key: "settings", title: "Settings", icon: "settings" },
];

function ExpandedTabs({ active, onChange }) {
    const bar = useRef(null);
    const [pill, setPill] = useState({ x: 0, w: 0, ready: false });
    useLayoutEffect(() => {
        const el = bar.current?.querySelector(`[data-key="${active}"]`);
        if (!el) return;
        const t = setTimeout(() => setPill({ x: el.offsetLeft, w: el.offsetWidth, ready: true }), 30);
        return () => clearTimeout(t);
    }, [active]);
    return (
        <div ref={bar} role="tablist" className="hx-scroll-none relative flex w-max max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-[#E7EAF3] bg-white p-1.5 shadow-[0_1px_2px_rgba(12,26,75,.06),0_8px_24px_-12px_rgba(12,26,75,.18)]">
            <span className={cn("absolute bottom-1.5 left-0 top-1.5 rounded-[11px] border border-[#C7D2FE] bg-[#EEF2FF]", pill.ready && "transition-[transform,width] [transition-duration:400ms] [transition-timing-function:cubic-bezier(.34,1.56,.64,1)]")}
                style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />
            {TABS.map((tab, i) => tab === "|" ? <span key={i} className="mx-1 h-[22px] w-px shrink-0 bg-[#E7EAF3]" aria-hidden="true" /> : (
                <button key={tab.key} data-key={tab.key} type="button" role="tab" aria-selected={active === tab.key} onClick={() => onChange(tab.key)}
                    className={cn("relative z-[1] inline-flex shrink-0 items-center rounded-[11px] px-3 py-2 text-sm font-bold transition-colors", active === tab.key ? "text-[#2F4BD8]" : "text-slate-500 hover:text-[#27272E]")}>
                    <Icon name={tab.icon} className="h-[18px] w-[18px]" />
                    <span className={cn("inline-block overflow-hidden whitespace-nowrap transition-all duration-300", active === tab.key ? "ml-2 max-w-[120px] opacity-100" : "ml-0 max-w-0 opacity-0")}>{tab.title}</span>
                </button>
            ))}
        </div>
    );
}

function Placeholder({ icon, title }) {
    return (
        <Panel className="grid justify-items-center gap-2 px-5 py-12 text-center">
            <span className="hx-blob relative grid h-[60px] w-[60px] place-items-center rounded-[18px] bg-[#EEF2FF] text-[#4C6FFF] [animation-duration:6s]"><Icon name={icon} className="h-7 w-7" /></span>
            <h2 className="text-lg font-extrabold text-[#27272E]">{title}</h2>
            <p className="max-w-md text-sm text-slate-500">Halaman ini masih kosong (placeholder). Tab tetap ada, siap diisi nanti.</p>
        </Panel>
    );
}

export default function Settings({ users, roles, divisions, apps, itAgents, itUserOptions, itStatuses, itResetAt }) {
    const urlTab = new URLSearchParams(window.location.search).get("tab");
    const [activeTab, setActiveTab] = useState(["categories", "users", "messages", "itcall", "settings"].includes(urlTab) ? urlTab : "home");
    const change = (key) => {
        setActiveTab(key);
        const u = new URL(window.location.href);
        if (key === "home") u.searchParams.delete("tab"); else u.searchParams.set("tab", key);
        u.searchParams.delete("page");
        window.history.replaceState(window.history.state, "", u.toString());
    };

    return (
        <AuthenticatedLayout>
            <Head title="Settings" />
            <PageHero icon="settings" title="Settings" subtitle="Kelola aplikasi, user, dan pengaturan HR One." crumbs={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]} />
            <div className="mx-auto grid max-w-[1240px] gap-4 px-4 py-5 sm:px-6">
                <ExpandedTabs active={activeTab} onChange={change} />
                <div key={activeTab} className="hx-up min-w-0">
                    {activeTab === "home" && <AppIndexManagement apps={apps || []} />}
                    {activeTab === "categories" && <DivisionManagement divisions={divisions || []} />}
                    {activeTab === "users" && <IndexUsermanagement users={users} roles={roles} divisions={divisions} />}
                    {activeTab === "messages" && <Placeholder icon="mail" title="Messages Settings" />}
                    {activeTab === "itcall" && <ItCallSettings agents={itAgents || []} users={itUserOptions || []} statuses={itStatuses || {}} resetAt={itResetAt} />}
                    {activeTab === "settings" && <Placeholder icon="settings" title="App Settings" />}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
