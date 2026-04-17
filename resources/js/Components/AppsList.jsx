import { useEffect, useMemo, useRef, useState } from "react";
import {
	ChevronLeft,
	ChevronRight,
	LayoutGrid,
} from "lucide-react";

import { cn } from "@/lib/utils";
import AppCard from "@/Components/ui/app-card";

export default function AppsList({
	title = "Aplikasi Lainnya",
	tabs: tabsProp,
	apps = [],
	divisions = [],
	className,
	cardClassName,
}) {
	const DRAG_THRESHOLD = 5;

	const tabs = useMemo(() => {
		if (tabsProp) return tabsProp;
		return divisions.map(d => ({
			id: d.id,
			label: d.name,
			icon: LayoutGrid,
		}));
	}, [tabsProp, divisions]);

	const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? null);
	const scrollRef = useRef(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const dragStateRef = useRef({
		isPointerDown: false,
		isDragging: false,
		hasPointerCapture: false,
		pointerId: null,
		startX: 0,
		startScrollLeft: 0,
	});

	const resetDragState = (event) => {
		if (!scrollRef.current) return;

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

	const filteredApps = useMemo(() => {
		return apps.filter((app) =>
			app.divisions?.some(d => d.id === activeTab)
		);
	}, [activeTab, apps]);

	const updateScrollState = () => {
		if (!scrollRef.current) return;
		const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
		const maxScrollLeft = scrollWidth - clientWidth;
		setCanScrollLeft(scrollLeft > 2);
		setCanScrollRight(scrollLeft < maxScrollLeft - 2);
	};

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollLeft = 0;
		}
		updateScrollState();
		const handleResize = () => updateScrollState();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [filteredApps]);

	const scrollByStep = (direction) => {
		if (!scrollRef.current) return;
		scrollRef.current.scrollBy({ left: direction * 352, behavior: "smooth" });
	};

	const handlePointerDown = (event) => {
		if (!scrollRef.current) return;
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

		if (!dragStateRef.current.isDragging) return;

		scrollRef.current.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
		updateScrollState();
	};

	const handlePointerUp = (event) => {
		if (!scrollRef.current) return;
		if (dragStateRef.current.pointerId !== event.pointerId) return;
		resetDragState(event);
		updateScrollState();
	};

	return (
		<section className={cn("w-full min-w-0 px-4 sm:px-6", className)}>
			<div className="flex flex-col gap-6 sm:gap-8">
				<h2 className="text-[20px] font-semibold leading-[1.36] text-[#27272E]">
					{title}
				</h2>

				<div className="w-full border-b border-[#E3E3E3]">
					<div
						className="flex w-full gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-6"
						role="tablist"
						aria-label="Kategori aplikasi"
					>
						{tabs.map((tab) => {
							const isActive = activeTab === tab.id;
							const Icon = tab.icon;

							return (
								<button
									key={tab.id}
									type="button"
									role="tab"
									aria-selected={isActive}
									onClick={() => setActiveTab(tab.id)}
									className={cn(
										"group inline-flex shrink-0 items-center gap-1.5 border-b-2 pb-2 text-left transition-colors",
										isActive
											? "border-[#292929] text-[#292929]"
											: "border-transparent text-[#C2BDBD] hover:text-[#8D8A8A]"
									)}
								>
									<Icon
										className={cn(
											"h-5 w-5 shrink-0",
											isActive ? "text-[#292929]" : "text-[#C2BDBD]"
										)}
										strokeWidth={isActive ? 2 : 1.8}
									/>
									<span
										className={cn(
											"leading-[23px] whitespace-nowrap",
											isActive ? "text-[16px] font-medium" : "text-[14px] font-normal"
										)}
									>
										{tab.label}
									</span>
								</button>
							);
						})}
					</div>
				</div>

				<div className="relative">
					<div
						role="tabpanel"
						ref={scrollRef}
						onPointerDown={handlePointerDown}
						onPointerMove={handlePointerMove}
						onPointerUp={handlePointerUp}
						onPointerCancel={handlePointerUp}
						onPointerLeave={handlePointerUp}
						onScroll={updateScrollState}
						className="flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-px py-[6px] pr-4 scroll-smooth touch-pan-x select-none sm:gap-6 sm:pr-16 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
					>
						{filteredApps.length > 0 ? (
							filteredApps.map((app, index) => (
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
							))
						) : (
							<div className="w-full rounded-[16px] border border-dashed border-[#D8D8D8] bg-white px-4 py-6 text-[14px] leading-[23px] text-[#8D8A8A]">
								Belum ada aplikasi pada kategori ini.
							</div>
						)}
					</div>

					{filteredApps.length > 1 ? (
						<>
							<button
								type="button"
								onClick={() => scrollByStep(-1)}
								disabled={!canScrollLeft}
								className="absolute left-0 top-1/2 hidden h-[45px] w-[45px] -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-[#EEF3FB] text-[#292929] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.10),0px_4px_4px_0px_rgba(0,0,0,0.09),0px_10px_6px_0px_rgba(0,0,0,0.05),0px_17px_7px_0px_rgba(0,0,0,0.01)] transition hover:bg-[#E4ECF7] disabled:pointer-events-none disabled:opacity-40 lg:flex"
								aria-label="Scroll applications left"
							>
								<ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
							</button>

							<button
								type="button"
								onClick={() => scrollByStep(1)}
								disabled={!canScrollRight}
								className="absolute right-0 top-1/2 hidden h-[45px] w-[45px] -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-[#EEF3FB] text-[#292929] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.10),0px_4px_4px_0px_rgba(0,0,0,0.09),0px_10px_6px_0px_rgba(0,0,0,0.05),0px_17px_7px_0px_rgba(0,0,0,0.01)] transition hover:bg-[#E4ECF7] disabled:pointer-events-none disabled:opacity-40 lg:flex"
								aria-label="Scroll applications right"
							>
								<ChevronRight className="h-5 w-5" strokeWidth={2.2} />
							</button>
						</>
					) : null}
				</div>
			</div>
		</section>
	);
}
