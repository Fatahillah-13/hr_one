import React from "react";
import Search from "./ui/search";
import heroImage from "../../images/hero-bg.jpg";

export default function HeaderSearch({
	value = "",
	onChange,
	onSubmit,
	placeholder = "Cari sistem yang anda butuhkan",
}) {
	return (
		<section className="relative w-full overflow-hidden">
			<div className="absolute inset-0">
				<img
					src={heroImage}
					alt="HR dashboard background"
					className="h-full w-full object-cover"
				/>
				<div className="absolute inset-0 bg-black/20" />
			</div>

			<div className="relative mx-auto flex h-[176px] w-full items-center justify-center px-4 sm:h-[190px] sm:px-6 md:h-[210px] lg:h-[222px]">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						onSubmit?.(value);
					}}
					className="w-full max-w-[780px]"
				>
					<label className="sr-only" htmlFor="header-system-search">
						Search systems
					</label>
					<div className="flex h-12 items-center gap-3 rounded-lg border border-black/10 bg-white px-3 shadow-[0_8px_20px_rgba(0,0,0,0.18)] sm:h-[50px] sm:px-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="h-5 w-5 shrink-0 text-[#292929]"
							aria-hidden="true"
						>
							<circle cx="11" cy="11" r="8" />
							<path d="M21 21l-4.35-4.35" />
						</svg>
						<input
							id="header-system-search"
							type="search"
							value={value}
							onChange={(event) => onChange?.(event.target.value)}
							placeholder={placeholder}
							className="h-full w-full border-0 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 sm:text-base"
						/>
					</div>
				</form>
			</div>
		</section>
	);
}
