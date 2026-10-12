import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-xl border-[#DDE2EE] bg-[#FBFCFE] px-3 py-2.5 text-sm shadow-none transition focus:border-[#4C6FFF] focus:bg-white focus:ring-4 focus:ring-[#4C6FFF]/15 disabled:bg-[#F1F3F9] disabled:text-slate-500 ' +
                className
            }
            ref={localRef}
        />
    );
});
