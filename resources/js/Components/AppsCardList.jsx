import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import AppCard from "@/Components/ui/app-card";
import Icon from "@/Components/hr/Icon";

// "Terakhir kali dibuka": bisa digeser dengan mouse/jari, plus tombol kiri/kanan (sama seperti sebelumnya).
export default function AppsCardList({ title = "Terakhir kali dibuka", apps = [], className, cardClassName }) {
    const DRAG_THRESHOLD = 5;
    const scrollRef = useRef(null);
    const drag = useRef({ down: false, moved: false, id: null, x: 0, left: 0 });
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(apps.length > 1);

    const update = () => {
        const el = scrollRef.current; if (!el) return;
        setCanLeft(el.scrollLeft > 2);
        setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    };
    useEffect(() => { update(); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update); }, [apps.length]);

    const by = (dir) => scrollRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
    const onDown = (e) => { if (e.pointerType !== "mouse") return; drag.current = { down: true, moved: false, id: e.pointerId, x: e.clientX, left: scrollRef.current.scrollLeft }; };
    const onMove = (e) => {
        const d = drag.current; if (!d.down || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x;
        if (!d.moved && Math.abs(dx) > DRAG_THRESHOLD) { d.moved = true; scrollRef.current.setPointerCapture(e.pointerId); scrollRef.current.style.cursor = "grabbing"; }
        if (d.moved) { scrollRef.current.scrollLeft = d.left - dx; update(); }
    };
    const onUp = (e) => {
        const d = drag.current; if (!d.down) return;
        if (scrollRef.current?.hasPointerCapture?.(e.pointerId)) scrollRef.current.releasePointerCapture(e.pointerId);
        if (scrollRef.current) scrollRef.current.style.cursor = "";
        drag.current.down = false; setTimeout(() => { drag.current.moved = false; }, 0);
    };

    return (
        <section className={cn("w-full min-w-0", className)}>
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold tracking-tight text-[#27272E]">{title}</h2>
                {apps.length > 1 && (
                    <div className="ml-auto flex gap-2">
                        {[["back", -1, canLeft, "Scroll applications left"], ["arrow", 1, canRight, "Scroll applications right"]].map(([ic, dir, can, lbl]) => (
                            <button key={lbl} type="button" onClick={() => by(dir)} disabled={!can} aria-label={lbl}
                                className="grid h-10 w-10 place-items-center rounded-full border border-[#E7EAF3] bg-white text-[#27272E] shadow-[0_4px_10px_-6px_rgba(12,26,75,.3)] transition hover:scale-105 hover:bg-[#EEF2FF] disabled:pointer-events-none disabled:opacity-35">
                                <Icon name={ic} className="h-4 w-4" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div ref={scrollRef} onScroll={update} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}
                onClickCapture={(e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); } }}
                className="hx-scroll-none mt-4 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-px py-1.5 select-none">
                {apps.map((app, index) => (
                    <div key={app.id ?? `${app.name}-${index}`} className="w-[270px] shrink-0 snap-start sm:w-[300px]">
                        <AppCard compact app={app} title={app.name} href={app.launch_url} delay={index * 0.05} className={cardClassName} />
                    </div>
                ))}
            </div>
        </section>
    );
}
