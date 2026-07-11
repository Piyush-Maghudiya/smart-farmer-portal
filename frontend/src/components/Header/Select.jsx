import React, { forwardRef, useId } from "react";

const Select = forwardRef(function Select({
    options,
    label,
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
            <select
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 cursor-pointer ${className}`}
                ref={ref}
                {...props}
                id={id}
            >
                {options?.map((option) => (
                    <option 
                        key={option.value || option} 
                        value={option.value || option}
                        className="bg-slate-950 text-slate-100"
                    >
                        {option.label || option}
                    </option>
                ))}
            </select>
        </div>
    );
});

export default Select;
