import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import React from "react";
import Sidebar from "@/Components/Sidebar";

export default function AuthenticatedLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
                {/* Desktop Sidebar */}
                <div className="hidden md:block w-64 shrink-0">
                    <Sidebar />
                </div>
                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/40 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
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
                    {/* Mobile Top Bar */}
                    <div className="md:hidden h-14 bg-white border-b flex items-center px-4">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                            aria-label="Open sidebar"
                        >
                            {/* Hamburger icon */}
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
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <div className="ml-3 font-semibold text-sm">My App</div>
                    </div>
                    <main className="p-6">{children}</main>
                </div>
            </div>
        </div>
    );
}
