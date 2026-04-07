import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import AppCard from "@/Components/ui/app-card";
import { cn } from "@/lib/utils";

export default function AppsCardList({
    title = "Terakhir kali dibuka",
    apps = [],
    className,
    cardClassName,
}) {
    const DRAG_THRESHOLD = 5;
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(apps.length > 1);
    const dragStateRef = useRef({
        isPointerDown: false,
        isDragging: false,
        hasPointerCapture: false,
        pointerId: null,
        startX: 0,
        startScrollLeft: 0,
    });

    const resetDragState = (event) => {
        if (!scrollRef.current) {
            return;
        }

        dragStateRef.current.isPointerDown = false;
        dragStateRef.current.isDragging = false;
        scrollRef.current.style.cursor = "grab";

        if (
            event
            && dragStateRef.current.hasPointerCapture
            && scrollRef.current.hasPointerCapture(event.pointerId)
        ) {
            scrollRef.current.releasePointerCapture(event.pointerId);
        }

        dragStateRef.current.hasPointerCapture = false;
        dragStateRef.current.pointerId = null;
    };

    const updateScrollState = () => {
        if (!scrollRef.current) {
            return;
        }

        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScrollLeft = scrollWidth - clientWidth;

        setCanScrollLeft(scrollLeft > 2);
        setCanScrollRight(scrollLeft < maxScrollLeft - 2);
    };

    useEffect(() => {
        updateScrollState();

        const handleResize = () => updateScrollState();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [apps.length]);

    const scrollByStep = (direction) => {
        if (!scrollRef.current) {
            return;
        }

        scrollRef.current.scrollBy({
            left: direction * 352,
            behavior: "smooth",
        });
    };

    const scrollNext = () => {
        scrollByStep(1);
    };

    const scrollPrev = () => {
        scrollByStep(-1);
    };

    const handlePointerDown = (event) => {
        if (!scrollRef.current) {
            return;
        }

        dragStateRef.current.isPointerDown = true;
        dragStateRef.current.isDragging = false;
        dragStateRef.current.hasPointerCapture = false;
        dragStateRef.current.pointerId = event.pointerId;
        dragStateRef.current.startX = event.clientX;
        dragStateRef.current.startScrollLeft = scrollRef.current.scrollLeft;
    };

    const handlePointerMove = (event) => {
        if (
            !scrollRef.current
            || !dragStateRef.current.isPointerDown
            || dragStateRef.current.pointerId !== event.pointerId
        ) {
            return;
        }

        const deltaX = event.clientX - dragStateRef.current.startX;

        if (!dragStateRef.current.isDragging && Math.abs(deltaX) > DRAG_THRESHOLD) {
            dragStateRef.current.isDragging = true;
            scrollRef.current.style.cursor = "grabbing";
            scrollRef.current.setPointerCapture(event.pointerId);
            dragStateRef.current.hasPointerCapture = true;
        }

        if (!dragStateRef.current.isDragging) {
            return;
        }

        scrollRef.current.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
        updateScrollState();
    };

    const handlePointerUp = (event) => {
        if (!scrollRef.current) {
            return;
        }

        if (dragStateRef.current.pointerId !== event.pointerId) {
            return;
        }

        resetDragState(event);
        updateScrollState();
    };

    return (
        <section className={cn("w-full min-w-0", className)}>
            <h2 className="text-[20px] font-semibold leading-[1.36] text-[#27272E]">
                {title}
            </h2>

            <div className="relative mt-5">
                <div
                    ref={scrollRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className="flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-px py-[6px] pr-4 scroll-smooth sm:gap-6 sm:pr-16 touch-pan-x select-none [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
                    onScroll={updateScrollState}
                >
                    {apps.map((app, index) => (
                        <div
                            key={app.id ?? `${app.name}-${index}`}
                            className="w-[280px] shrink-0 snap-start sm:w-[328px]"
                        >
                            <AppCard
                                title={app.name}
                                division={app.divisions?.map(d => d.name).join(', ') || '-'}
                                description={app.description || ''}
                                initials={app.name?.substring(0, 2).toUpperCase()}
                                avatarSrc={app.icon}
                                href={app.sso_enabled ? route("sso.launch", app.slug) : app.app_link}
                                className={cn("max-w-none", cardClassName)}
                            />
                        </div>
                    ))}
                </div>

                {apps.length > 1 ? (
                    <>
                        <button
                            type="button"
                            onClick={scrollPrev}
                            disabled={!canScrollLeft}
                            className="absolute left-0 top-1/2 hidden h-[45px] w-[45px] -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-[#EEF3FB] text-[#292929] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.10),0px_4px_4px_0px_rgba(0,0,0,0.09),0px_10px_6px_0px_rgba(0,0,0,0.05),0px_17px_7px_0px_rgba(0,0,0,0.01)] transition hover:bg-[#E4ECF7] disabled:pointer-events-none disabled:opacity-40 lg:flex"
                            aria-label="Scroll applications left"
                        >
                            <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
                        </button>

                        <button
                            type="button"
                            onClick={scrollNext}
                            disabled={!canScrollRight}
                            className="absolute right-0 top-1/2 hidden h-[45px] w-[45px] -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-[#EEF3FB] text-[#292929] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.10),0px_4px_4px_0px_rgba(0,0,0,0.09),0px_10px_6px_0px_rgba(0,0,0,0.05),0px_17px_7px_0px_rgba(0,0,0,0.01)] transition hover:bg-[#E4ECF7] disabled:pointer-events-none disabled:opacity-40 lg:flex"
                            aria-label="Scroll applications right"
                        >
                            <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
                        </button>
                    </>
                ) : null}
            </div>
        </section>
    );
}
