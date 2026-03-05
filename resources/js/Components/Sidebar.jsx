import React from "react";
import { Link, usePage } from "@inertiajs/react";

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

export default function Sidebar() {
    const { url } = usePage();
    const currentUrl = url.split("?")[0];

    return (
        <aside className="h-screen sticky top-0 border-r bg-white flex-col">
            <div className="h-16 px-4 flex items-center border-b">
                <div className="font-semibold">My App</div>
            </div>
            <nav className="p-3 space-y-1 flex-1">
                {navItems.map((item) => {
                    const active = isActive(currentUrl, item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={[
                                "block rounded-lg px-3 py-2 text-sm transition",
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
