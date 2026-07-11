import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Logo from "../Logo";
import { logout as authLogout } from "../../store/authSlice";
import { authService } from "../../services/api";
import { LogOut, Menu, X, LayoutDashboard, MessageSquareCode, FileText, Store } from "lucide-react";

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);

    const { status: authStatus, userData } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        try {
            await authService.logout();
            dispatch(authLogout());
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
            // Backup client state clear
            dispatch(authLogout());
        }
    };

    const navigationItems = [
        { name: "Home", path: "/" },
        { name: "Crop Gallery", path: "/crops", icon: FileText },
        { name: "Agro Marketplace", path: "/marketplace", icon: Store },
        { name: "Q&A Forum", path: "/qa", icon: MessageSquareCode },
        ...(authStatus ? [{ name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }] : [])
    ];

    return (
        <header className="sticky top-0 z-50 glass-panel border-b border-slate-900 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center">
                        <Logo />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navigationItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`text-sm font-semibold transition-all duration-200 ${
                                    location.pathname === item.path
                                        ? "text-green-500 font-bold"
                                        : "text-slate-300 hover:text-green-400"
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile or Login/Signup */}
                    <div className="hidden md:flex items-center gap-4">
                        {authStatus && userData ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                                    {userData.avatar?.url ? (
                                        <img
                                            src={userData.avatar.url}
                                            alt={userData.fullname}
                                            className="w-8 h-8 rounded-full object-cover border border-green-500/30"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold">
                                            {userData.fullname?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-slate-100">{userData.fullname}</p>
                                        <span className="text-[10px] text-green-500 uppercase font-extrabold tracking-wider bg-green-500/10 px-1.5 py-0.5 rounded-md">
                                            {userData.role}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-xl bg-slate-900/60 hover:bg-red-500/10 hover:text-red-500 border border-slate-800 hover:border-red-500/30 transition-all duration-200 cursor-pointer"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-all"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/10 transition-all"
                                >
                                    Join Community
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-xl text-slate-400 hover:text-white focus:outline-none hover:bg-slate-900 transition-all cursor-pointer"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden bg-slate-950/95 border-b border-slate-900 px-4 pt-2 pb-4 space-y-2">
                    {navigationItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={`block px-3 py-2 rounded-xl text-base font-semibold transition-all ${
                                location.pathname === item.path
                                    ? "bg-green-500/10 text-green-500"
                                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                            }`}
                        >
                            {item.name}
                        </Link>
                    ))}

                    <div className="pt-4 border-t border-slate-900">
                        {authStatus && userData ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-3 py-2">
                                    <img
                                        src={userData.avatar?.url}
                                        alt={userData.fullname}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-white">{userData.fullname}</p>
                                        <p className="text-xs text-slate-400">{userData.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-500 font-semibold"
                                >
                                    <LogOut size={18} /> Logout
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 px-3">
                                <Link
                                    to="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="py-2.5 text-center text-sm font-semibold border border-slate-800 rounded-xl hover:bg-slate-900"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    onClick={() => setIsOpen(false)}
                                    className="py-2.5 text-center text-sm font-semibold bg-green-600 text-white rounded-xl"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
