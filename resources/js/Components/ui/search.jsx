import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/Components/hr/Icon";
import { AppTile } from "@/Components/hr/ui";
import { openApp } from "@/Components/ui/app-card";
import { cn } from "@/lib/utils";

// Pencarian sistem: Ctrl+K untuk fokus, saran aplikasi, panah atas/bawah, Enter membuka (sama seperti sebelumnya).
export default function Search({ value = "", onChange, onSubmit, placeholder = "Cari sistem yang anda butuhkan", apps = [] }) {
    const [internalValue, setInternalValue] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);
    const isControlled = typeof onChange === "function";

    const suggestions = useMemo(() => apps.map((app) => ({ app, id: app.id, title: app.name, division: app.divisions?.map((d) => d.name).join(", ") || "-", href: app.launch_url })), [apps]);

<<<<<<< HEAD
    useEffect(() => { if (isControlled) setInternalValue(value ?? ""); }, [isControlled, value]);
    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); inputRef.current?.focus(); setIsOpen(true); }
        };
        const handleOutsideClick = (event) => { if (!wrapperRef.current?.contains(event.target)) setIsOpen(false); };
        window.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleOutsideClick);
        return () => { window.removeEventListener("keydown", handleKeyDown); document.removeEventListener("mousedown", handleOutsideClick); };
    }, []);
=======
  const suggestions = useMemo(() => {
    return apps.map((app, i) => ({
      id: app.id,
      title: app.name,
      division: app.divisions?.map(d => d.name).join(', ') || '-',
      initials: app.name?.substring(0, 2).toUpperCase(),
      color: COLORS[i % COLORS.length],
      href: app.app_link,
    }));
  }, [apps]);
>>>>>>> origin/main

    const currentValue = !isControlled || value === undefined || value === null ? internalValue : value;
    const filteredSuggestions = useMemo(() => {
        const query = currentValue.trim().toLowerCase();
        if (!query) return suggestions.slice(0, 5);
        return suggestions.filter((item) => item.title.toLowerCase().includes(query) || item.division.toLowerCase().includes(query)).slice(0, 6);
    }, [currentValue, suggestions]);

    const pick = (item) => { setInternalValue(item.title); onChange?.(item.title); setIsOpen(false); openApp(item.href); };
    const handleSubmit = (event) => {
        event.preventDefault();
        const target = highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length ? filteredSuggestions[highlightedIndex] : filteredSuggestions[0];
        if (target) pick(target);
        onSubmit?.(currentValue);
    };
    const handleKeyDown = (event) => {
        if (!isOpen || filteredSuggestions.length === 0) return;
        if (event.key === "ArrowDown") { event.preventDefault(); setHighlightedIndex((p) => (p < filteredSuggestions.length - 1 ? p + 1 : 0)); }
        else if (event.key === "ArrowUp") { event.preventDefault(); setHighlightedIndex((p) => (p > 0 ? p - 1 : filteredSuggestions.length - 1)); }
        else if (event.key === "Escape") { setIsOpen(false); setHighlightedIndex(-1); }
    };

    return (
        <form ref={wrapperRef} onSubmit={handleSubmit} className="relative w-full max-w-[760px]" autoComplete="off">
            <label className="sr-only" htmlFor="header-system-search">Search systems</label>
            <div className="flex h-[52px] items-center gap-3 rounded-[18px] bg-white/[.97] px-4 text-[#27272E] shadow-[0_24px_48px_-20px_rgba(10,20,70,.75),0_0_0_6px_rgba(255,255,255,.14)] transition duration-300 focus-within:-translate-y-0.5 focus-within:scale-[1.01] focus-within:shadow-[0_28px_56px_-20px_rgba(10,20,70,.85),0_0_0_6px_rgba(143,163,255,.55)] sm:h-[58px] sm:px-[18px]">
                <Icon name="search" className="h-5 w-5 shrink-0 text-[#4C6FFF]" />
                <input id="header-system-search" ref={inputRef} type="search" value={currentValue}
                    onChange={(e) => { setInternalValue(e.target.value); setIsOpen(true); setHighlightedIndex(-1); onChange?.(e.target.value); }}
                    onFocus={() => setIsOpen(true)} onKeyDown={handleKeyDown} placeholder={placeholder}
                    className="h-full w-full border-0 bg-transparent p-0 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0 sm:text-base" />
                <span className="hidden rounded-lg border border-[#E7EAF3] bg-[#F1F3F9] px-2 py-1 text-xs font-extrabold text-slate-500 sm:inline-flex">Ctrl+K</span>
            </div>
            {isOpen && (
                <div className="hx-pop absolute left-0 right-0 top-[calc(100%+10px)] z-30 grid gap-0.5 rounded-[18px] bg-white p-2 text-left shadow-[0_30px_60px_-20px_rgba(10,20,70,.55)]" role="listbox">
                    {!currentValue.trim() && <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-slate-400">Saran</p>}
                    {filteredSuggestions.length > 0 ? filteredSuggestions.map((item, index) => (
                        <button key={item.id ?? item.title} type="button" role="option" aria-selected={index === highlightedIndex}
                            onMouseDown={(e) => { e.preventDefault(); pick(item); }} onMouseEnter={() => setHighlightedIndex(index)}
                            className={cn("group flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors", index === highlightedIndex ? "bg-[#EEF2FF]" : "hover:bg-[#EEF2FF]")}>
                            <AppTile app={item.app} size="sm" />
                            <span className="min-w-0 flex-1"><b className="block truncate text-sm text-[#27272E]">{item.title}</b><small className="block truncate text-xs text-slate-500">{item.division}</small></span>
                            <kbd className={cn("rounded-md border border-[#E7EAF3] px-1.5 text-[11px] font-bold text-slate-400 transition-opacity", index === highlightedIndex ? "opacity-100" : "opacity-0")}>↵</kbd>
                        </button>
                    )) : (
                        <div className="flex items-center gap-2 px-3 py-3.5 text-sm text-slate-500"><Icon name="search" className="h-4 w-4" />Sistem tidak ditemukan.</div>
                    )}
                </div>
            )}
        </form>
    );
}
