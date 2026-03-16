import { cn } from "@/lib/utils";

export default function AppMiniCard({
	title = "Nama App",
	initials = "MJ",
	avatarSrc,
	className,
}) {
	return (
		<article
			className={cn(
				"w-full max-w-[333px] rounded-[16px] bg-white px-[18px] py-[12px] shadow-[0px_0px_1px_0px_rgba(12,26,75,0.24),0px_3px_8px_0px_rgba(50,50,71,0.05)]",
				className
			)}
		>
			<div className="flex items-center gap-6 overflow-hidden">
				<div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#4C6FFF]">
					{avatarSrc ? (
						<img src={avatarSrc} alt={title} className="h-full w-full object-cover" />
					) : null}
					<span className="absolute inset-0 flex items-center justify-center text-center text-[18px] font-bold tracking-[-0.09px] text-white">
						{initials}
					</span>
				</div>

				<p className="min-w-0 flex-1 truncate text-[16px] font-semibold leading-[1.36] text-[#27272E]">
					{title}
				</p>
			</div>
		</article>
	);
}
