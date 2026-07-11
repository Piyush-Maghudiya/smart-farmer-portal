import React from "react";

function Logo({ className = "", size = "h-8" }) {
    return (
        <div className={`flex items-center gap-2 font-display ${className}`}>
            <div className="bg-green-500 text-slate-950 p-1.5 rounded-lg flex items-center justify-center font-bold text-lg leading-none shadow-lg shadow-green-500/20">
                🌾
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                SmartFarmer
            </span>
        </div>
    );
}

export default Logo;
