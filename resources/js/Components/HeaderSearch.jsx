import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import Search from "./ui/search";
import heroImage from "../../images/hero-bg.jpg";
import Icon from "@/Components/hr/Icon";
import { CountUp } from "@/Components/hr/ui";

const greet = (h) => (h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam");

// Banner Beranda: sapaan + tanggal & jam + pencarian sistem + ringkasan. Gambar banner lama dipakai sebagai tekstur.
export default function HeaderSearch({ value = "", onChange, onSubmit, placeholder = "Cari sistem yang anda butuhkan", apps = [], divisions = [] }) {
    const user = usePage().props?.auth?.user;
    const [now, setNow] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
    const firstName = String(user?.name || "").split(" ")[0];
    const sso = apps.filter((a) => a.sso_enabled).length;

    return (
        <section className="hx-gradient relative z-20 w-full text-white">
            <span className="pointer-events-none absolute inset-0 overflow-hidden">
                <img src={heroImage} alt="" className="h-full w-full object-cover opacity-[.22] mix-blend-luminosity" />
                <span className="absolute inset-0 opacity-[.12] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
                <span className="hx-blob -right-28 -top-44 h-[420px] w-[420px] bg-[radial-gradient(circle,rgba(255,255,255,.22),transparent_70%)]" />
                <span className="hx-blob -bottom-40 -left-24 h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(143,163,255,.55),transparent_70%)] [animation-delay:-4s]" />
                <span className="hx-blob -top-14 left-[46%] h-[180px] w-[180px] bg-[radial-gradient(circle,rgba(56,189,248,.35),transparent_70%)] [animation-delay:-8s]" />
            </span>
            <span className="absolute -bottom-px left-0 right-0 z-[1] h-[34px] rounded-t-[34px] bg-[#F4F6FB]" />
            <div className="relative z-[2] mx-auto flex max-w-[1180px] flex-col items-center px-4 pb-[70px] pt-7 text-center sm:px-6 sm:pt-10">
                <span className="hx-up inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-[13px] font-bold backdrop-blur">
                    <Icon name="cal" className="h-[15px] w-[15px]" />
                    {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    <b className="hidden border-l border-white/35 pl-2 tabular-nums sm:inline">{now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</b>
                </span>
                <h1 className="hx-up mt-3.5 text-[28px] font-extrabold tracking-tight [animation-delay:.06s] sm:text-[42px]">
                    {greet(now.getHours())}{firstName ? `, ${firstName}` : ""} <span className="hx-wave">👋</span>
                </h1>
                <p className="hx-up mt-1.5 text-[15.5px] text-white/85 [animation-delay:.12s]">Satu login untuk semua sistem HRD PT. Hwaseung Indonesia.</p>
                <div className="hx-up mt-6 flex w-full justify-center [animation-delay:.18s]">
                    <Search value={value} onChange={onChange} onSubmit={onSubmit} placeholder={placeholder} apps={apps} />
                </div>
                <div className="hx-up mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13.5px] text-white/90 [animation-delay:.26s]">
                    <span><b className="mr-1 text-[17px] font-extrabold"><CountUp value={apps.length} /></b> aplikasi</span>
                    <span><b className="mr-1 text-[17px] font-extrabold"><CountUp value={sso} /></b> terhubung SSO</span>
                    <span><b className="mr-1 text-[17px] font-extrabold"><CountUp value={divisions.length} /></b> divisi</span>
                </div>
            </div>
        </section>
    );
}
