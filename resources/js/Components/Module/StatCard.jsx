import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

const TONES = {
    blue: "bg-[#EEF2FF] text-[#4C6FFF]",
    green: "bg-emerald-50 text-emerald-600",
    gray: "bg-slate-100 text-slate-500",
    amber: "bg-amber-50 text-amber-600",
};

/** Angka yang "menghitung naik" saat pertama tampil. */
export function CountUp({ value = 0, duration = 900 }) {
    const reduce = useReducedMotion();
    const [display, setDisplay] = useState(reduce ? value : 0);
    const frame = useRef();

    useEffect(() => {
        if (reduce) {
            setDisplay(value);
            return;
        }
        const start = performance.now();
        const from = 0;
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(from + (value - from) * eased));
            if (p < 1) frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame.current);
    }, [value, duration, reduce]);

    return <>{formatNumber(display)}</>;
}

export default function StatCard({ label, value, icon: Icon, tone = "blue", hint, index = 0, className, children }) {
    const reduce = useReducedMotion();

    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reduce ? undefined : { y: -3 }}
            className={cn("group rounded-2xl bg-white p-4 sm:p-5 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_8px_24px_-12px_rgba(12,26,75,0.18)] ring-1 ring-slate-100 transition-shadow hover:shadow-[0_12px_32px_-12px_rgba(12,26,75,0.28)]", className)}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    {value !== undefined && (
                        <p className="mt-2 text-2xl font-bold sm:text-3xl tracking-tight text-[#27272E]">
                            <CountUp value={value} />
                        </p>
                    )}
                </div>
                {Icon && (
                    <div
                        className={cn(
                            "flex h-9 w-9 shrink-0 items-center sm:h-11 sm:w-11 justify-center rounded-xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110",
                            TONES[tone],
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>
            {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
            {children}
        </motion.div>
    );
}
