import { useMemo, useState } from "react";
import {
	BadgeCheck,
	Calculator,
	Flag,
	LayoutGrid,
	MousePointer2,
	Smile,
	Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import AppMiniCard from "@/Components/ui/app-mini-card";

const defaultTabs = [
	{ id: "hrd", label: "HRD", icon: LayoutGrid },
	{ id: "payroll", label: "Payroll", icon: Calculator },
	{ id: "od-training", label: "OD/Training", icon: BadgeCheck },
	{ id: "hr-it", label: "HR IT", icon: MousePointer2 },
	{ id: "konseling", label: "Konseling", icon: Smile },
	{ id: "hi", label: "HI", icon: Flag },
	{ id: "rekrutmen", label: "Rekrutmen", icon: Users },
];

const defaultApps = [
	{ id: 1, title: "Nama App", initials: "MJ", category: "hr-it" },
	{ id: 2, title: "Nama App", initials: "MJ", category: "hr-it" },
	{ id: 3, title: "Nama App", initials: "MJ", category: "hr-it" },
	{ id: 4, title: "Nama App", initials: "MJ", category: "hr-it" },
	{ id: 5, title: "Nama App", initials: "MJ", category: "hr-it" },
];

export default function AppsList({
	title = "Aplikasi Lainnya",
	tabs = defaultTabs,
	apps = defaultApps,
	defaultActiveTab = "hr-it",
	className,
	cardClassName,
}) {
	const [activeTab, setActiveTab] = useState(defaultActiveTab);

	const filteredApps = useMemo(() => {
		return apps.filter((app) => app.category === activeTab);
	}, [activeTab, apps]);

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

				<div
					role="tabpanel"
					className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 xl:grid-cols-4"
				>
					{filteredApps.length > 0 ? (
						filteredApps.map((app) => (
								<AppMiniCard
								key={app.id}
								title={app.title}
								initials={app.initials}
								avatarSrc={app.avatarSrc}
								className={cn("max-w-none", cardClassName)}
							/>
						))
					) : (
						<div className="col-span-full rounded-[16px] border border-dashed border-[#D8D8D8] bg-white px-4 py-6 text-[14px] leading-[23px] text-[#8D8A8A]">
							Belum ada aplikasi pada kategori ini.
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
