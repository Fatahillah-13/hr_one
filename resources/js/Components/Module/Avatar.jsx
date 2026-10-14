import { cn } from "@/lib/utils";
import { hashIndex, initials } from "@/lib/format";

// Kelas warna ditulis di file .jsx agar ikut dipindai Tailwind (content: resources/js/**/*.jsx).
const COLORS = [
    "from-[#4C6FFF] to-[#7B93FF]",
    "from-[#16A34A] to-[#4ADE80]",
    "from-[#F97316] to-[#FDBA74]",
    "from-[#DB2777] to-[#F472B6]",
    "from-[#0891B2] to-[#67E8F9]",
    "from-[#7C3AED] to-[#A78BFA]",
];

const SIZES = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    xl: "h-24 w-24 text-3xl",
};

export default function Avatar({ name, size = "sm", className }) {
    return (
        <div
            className={cn(
                "flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-sm",
                COLORS[hashIndex(name, COLORS.length)],
                SIZES[size],
                className,
            )}
            aria-hidden="true"
        >
            {initials(name)}
        </div>
    );
}
