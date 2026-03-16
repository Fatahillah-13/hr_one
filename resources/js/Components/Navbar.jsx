import React from "react";
import logoImage from "../../images/logo.png";
import NotificationDropdown from "./NotificationDropdown";
import { AvatarDropdown } from "./AvatarDropdown";

function getAvatarUrl(avatar) {
	if (!avatar) return null;
	if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("/")) {
		return avatar;
	}
	return `/storage/${avatar}`;
}

function getInitials(name = "U") {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((chunk) => chunk[0].toUpperCase())
		.join("");
}

export default function Navbar({ user }) {
	const avatarUrl = getAvatarUrl(user?.avatar);

	return (
		<header className="border-b border-gray-200 bg-white shadow-sm">
			<div className="flex items-center justify-between px-4 py-3 sm:px-6 md:px-7">
				<div className="flex items-center gap-3">

					<img
						src={logoImage}
						alt="HR One System"
						className="h-9 w-auto sm:h-10 md:h-12"
					/>
				</div>

				<div className="flex items-center gap-3 sm:gap-4 md:gap-7">
					<NotificationDropdown />
					{/* <div className="relative h-11 w-11 overflow-hidden rounded-full bg-blue-500 text-white">
						{avatarUrl ? (
							<img
								src={avatarUrl}
								alt={user?.name || "User avatar"}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center text-sm font-semibold">
								{getInitials(user?.name)}
							</div>
						)}
					</div> */}
					<AvatarDropdown />
				</div>
			</div>
		</header>
	);
}
