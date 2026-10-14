import { motion, useReducedMotion } from "motion/react";

export default function EmptyState({ icon: Icon, title, description, action }) {
    const reduce = useReducedMotion();

    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center px-6 py-16 text-center"
        >
            {Icon && (
                <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4C6FFF]"
                    animate={reduce ? undefined : { y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Icon className="h-8 w-8" />
                </motion.div>
            )}
            <h3 className="mt-4 text-base font-semibold text-[#27272E]">{title}</h3>
            {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </motion.div>
    );
}
