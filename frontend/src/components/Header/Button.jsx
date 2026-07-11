import React from "react";

function Button({
    children,
    type = "button",
    bgColor = "bg-green-600 hover:bg-green-500 active:bg-green-700",
    textColor = "text-white",
    className = "",
    ...props
}) {
    return (
        <button
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${bgColor} ${textColor} ${className}`}
            type={type}
            {...props}
        >
            {children}
        </button>
    );
}

export default Button;
