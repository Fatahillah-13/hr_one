import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Menu dropdown ringan. trigger: (props) => ReactNode
 * items: [{ label, description?, href, icon?, external? }]
 */
export default function Dropdown({ trigger, items = [], align = "right" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={ref} className="relative">
            {trigger({ onClick: () => setOpen((o) => !o), "aria-expanded": open })}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.16 }}
                        className={cn(
                            "absolute z-30 mt-2 w-64 origin-top rounded-xl bg-white p-1.5 text-slate-700 shadow-[0_16px_40px_-12px_rgba(12,26,75,0.35)] ring-1 ring-slate-100",
                            align === "right" ? "right-0" : "left-0",
                        )}
                        role="menu"
                    >
                        {items.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                target={item.external ? "_blank" : undefined}
                                rel={item.external ? "noopener noreferrer" : undefined}
                                onClick={() => setOpen(false)}
                                className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-50"
                                role="menuitem"
                            >
                                {item.icon && <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#4C6FFF]" />}
                                <span>
                                    <span className="block text-sm font-semibold text-slate-800">{item.label}</span>
                                    {item.description && <span className="block text-xs text-slate-500">{item.description}</span>}
                                </span>
                            </a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
