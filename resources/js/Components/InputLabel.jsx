export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-[13px] font-bold text-[#425466] ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
