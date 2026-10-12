export default function PrimaryButton({ className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-gradient-to-br from-[#4C6FFF] to-[#2F4BD8] px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_10px_20px_-12px_rgba(76,111,255,.95)] transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#4C6FFF]/25 active:scale-[.97] ${
                    disabled && 'opacity-50'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
