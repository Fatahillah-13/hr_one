import { useEffect, useState } from "react";
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
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <header
            className={`sticky top-0 z-50 border-b transition-colors duration-300 ${isScrolled
                    ? "border-transparent bg-white/70 shadow-none"
                    : "border-gray-200 bg-white shadow-sm"
                }`}
        >
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 md:px-7">
                <div className="flex items-center gap-3">

                    <a href="/">
                        <img
                            src={logoImage}
                            alt="HR One System"
                            className="h-9 w-auto sm:h-10 md:h-12"
                        />
                    </a>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 md:gap-7">
                    <NotificationDropdown />
                    <AvatarDropdown />
                </div>
            </div>
        </header>
    );
}
