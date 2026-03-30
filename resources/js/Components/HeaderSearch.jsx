import React from "react";
import Search from "./ui/search";
import heroImage from "../../images/hero-bg.jpg";

export default function HeaderSearch({
	value = "",
	onChange,
	onSubmit,
	placeholder = "Cari sistem yang anda butuhkan",
	apps = [],
}) {
	return (
		<section className="relative z-20 w-full overflow-visible">
			<div className="absolute inset-0">
				<img
					src={heroImage}
					alt="HR dashboard background"
					className="h-full w-full object-cover"
				/>
				<div className="absolute inset-0 bg-black/20" />
			</div>

			<div className="relative mx-auto flex h-[176px] w-full items-center justify-center px-4 sm:h-[190px] sm:px-6 md:h-[210px] lg:h-[222px]">
                <Search value={value} onChange={onChange} onSubmit={onSubmit} placeholder={placeholder} apps={apps}></Search>
			</div>
		</section>
	);
}
