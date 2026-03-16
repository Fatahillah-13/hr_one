import { cn } from "@/lib/utils";

export default function AppCard({
	title = "Nama App",
	division = "HRD",
	description = "Write an amazing description in this dedicated card section. Each word counts.",
	initials = "MJ",
	avatarSrc,
	className,
}) {
	return (
		<article
			className={cn(
				"w-full max-w-[320px] rounded-[16px] bg-white px-[18px] py-[16px] shadow-[0px_0px_1px_0px_rgba(12,26,75,0.24),0px_3px_8px_0px_rgba(50,50,71,0.05)]",
				className
			)}
		>
			<div className="flex items-center gap-6 overflow-hidden">
				<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#4C6FFF]">
					{avatarSrc ? (
						<img src={avatarSrc} alt={title} className="h-full w-full object-cover" />
					) : null}
					<span className="absolute inset-0 flex items-center justify-center text-center text-[18px] font-bold tracking-[-0.09px] text-white">
						{initials}
					</span>
				</div>

				<div className="min-w-0 flex-1 overflow-hidden">
					<p className="truncate text-[16px] font-semibold leading-[1.36] text-[#27272E]">{title}</p>
					<div className="mt-2 inline-flex items-center rounded-[6px] bg-[#E4ECF7] px-2 py-[2px]">
						<span className="text-[10px] font-bold leading-4 text-[#505780]">{division}</span>
					</div>
				</div>
			</div>

			<p className="mt-[10px] text-[14px] leading-[23px] text-[#425466]">
				{description}
			</p>
		</article>
	);
}
