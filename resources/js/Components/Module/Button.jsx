import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
    primary:
        "bg-[#4C6FFF] text-white shadow-[0_6px_16px_-6px_rgba(76,111,255,0.7)] hover:bg-[#3D5EF0] hover:shadow-[0_10px_22px_-8px_rgba(76,111,255,0.8)]",
    secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    glass: "bg-white/15 text-white ring-1 ring-inset ring-white/30 backdrop-blur hover:bg-white/25",
};

const SIZES = {
    sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
    md: "h-10 gap-2 rounded-xl px-4 text-sm",
    icon: "h-8 w-8 justify-center rounded-lg",
};

/** Tombol modul. Pakai `as="a"` untuk link biasa. */
const Button = forwardRef(function Button(
    { as: Tag = "button", variant = "secondary", size = "md", className, children, ...props },
    ref,
) {
    return (
        <Tag
            ref={ref}
            className={cn(
                "inline-flex items-center font-semibold transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C6FFF]/50 disabled:pointer-events-none disabled:opacity-50",
                VARIANTS[variant],
                SIZES[size],
                className,
            )}
            {...(Tag === "button" && !props.type ? { type: "button" } : {})}
            {...props}
        >
            {children}
        </Tag>
    );
});

export default Button;
