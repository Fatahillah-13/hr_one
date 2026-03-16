import { usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import React from "react";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";

export default function AuthenticatedLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { props } = usePage();
    const user = props?.auth?.user;

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setSidebarOpen(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="flex min-h-screen">
                {/* Mobile Drawer */}
                <div
                    className={[
                        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform md:hidden",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full",
                    ].join(" ")}
                >
                    <Sidebar onClose={() => setSidebarOpen(false)} />
                </div>
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <Navbar
                        user={user}
                        onOpenSidebar={() => setSidebarOpen(true)}
                    />
                    <main>{children}</main>
                </div>
            </div>
        </div>
    );
}
