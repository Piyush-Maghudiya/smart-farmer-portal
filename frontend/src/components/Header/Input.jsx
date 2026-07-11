import { forwardRef, useId } from "react";

const Input = forwardRef(function Input({
    label,
    type = "text",
    className = "",
    ...props
}, ref) {
    const id = useId();
    return (
        <div className="w-full">
            {label && (
                <label 
                    className="block text-sm font-semibold text-slate-300 mb-1.5 pl-1" 
                    htmlFor={id}
                >
                    {label}
                </label>
            )}
            <input
                type={type}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 outline-none focus:bg-slate-950 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 ${className}`}
                ref={ref}
                {...props}
                id={id}
            />
        </div>
    );
});

export default Input;
