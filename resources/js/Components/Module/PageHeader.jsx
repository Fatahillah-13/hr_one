import { Link } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Header halaman modul: banner gradasi, breadcrumb, judul, dan tombol aksi.
 * breadcrumbs: [{ label, href? }]
 */
export default function PageHeader({ breadcrumbs = [], title, subtitle, icon: Icon, actions }) {
    const reduce = useReducedMotion();

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-[#2F4BD8] via-[#4C6FFF] to-[#6D8BFF] px-4 pb-24 pt-6 text-white sm:px-6 lg:px-8">
            {/* dekorasi lingkaran bergerak pelan */}
            <motion.div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
                animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                aria-hidden
                className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#9DB0FF]/20 blur-2xl"
                animate={reduce ? undefined : { x: [0, 30, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]"
            />

            <div className="relative mx-auto max-w-7xl">
                {breadcrumbs.length > 0 && (
                    <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-white/70" aria-label="Breadcrumb">
                        {breadcrumbs.map((b, i) => (
                            <span key={i} className="flex items-center gap-1">
                                {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                                {b.href ? (
                                    <Link href={b.href} className="transition hover:text-white">
                                        {b.label}
                                    </Link>
                                ) : (
                                    <span className="text-white">{b.label}</span>
                                )}
                            </span>
                        ))}
                    </nav>
                )}

                <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <motion.div
                        className="flex items-center gap-4"
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {Icon && (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/30 backdrop-blur">
                                <Icon className="h-7 w-7" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                            {subtitle && <p className="mt-1 max-w-xl text-sm text-white/80">{subtitle}</p>}
                        </div>
                    </motion.div>

                    {actions && (
                        <motion.div
                            className="flex flex-wrap items-center gap-2"
                            initial={reduce ? false : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {actions}
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
}
