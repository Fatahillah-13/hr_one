import React from "react";
import { Link, usePage } from "@inertiajs/react";
import logoImage from "../../images/logo.png";

const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Profile", href: "/profile" },
    { label: "Settings", href: "/settings" },
    { label: "Logout", href: "/logout" },
];

function isActive(currentUrl, href) {
    if (href === "/") return currentUrl === "/";
    return currentUrl === href || currentUrl.startsWith(href + "/");
}

export default function Sidebar({ onClose }) {
    const { url } = usePage();
    const currentUrl = url.split("?")[0];

    return (
        <aside className="h-screen border-r bg-white flex flex-col">
            <div className="h-24 px-4 flex items-center border-b justify-center">
                <img src={logoImage} alt="Logo" className="h-16 w-auto" />
                {/* Close button (mobile only) */}
                <button
                    type="button"
                    onClick={onClose}
                    className="md:hidden rounded-md p-2 hover:bg-gray-100"
                    aria-label="Close sidebar"
                >
                    {/* X icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
            <nav className="p-3 space-y-1 flex-1">
                {navItems.map((item) => {
                    const active = isActive(currentUrl, item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => onClose?.()}
                            className={[
                                "block rounded-lg px-3 py-3 text-sm transition",
                                active
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-700 hover:bg-gray-100",
                            ].join(" ")}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t">
                <div className="text-xs text-gray-500">v1.0</div>
            </div>
        </aside>
    );
}
