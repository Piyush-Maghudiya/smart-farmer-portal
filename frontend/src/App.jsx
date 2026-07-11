import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";
import { Header, Footer } from "./components/index";
import { authService } from "./services/api";
import { login, logout } from "./store/authSlice";

function App() {
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    useEffect(() => {
        const checkUserSession = async () => {
            try {
                const res = await authService.getCurrentUser();
                if (res.data.success && res.data.data) {
                    dispatch(login(res.data.data));
                } else {
                    dispatch(logout());
                }
            } catch (error) {
                // Not authenticated or session expired
                dispatch(logout());
            } finally {
                setLoading(false);
            }
        };

        checkUserSession();
    }, [dispatch]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Booting Smart Farmer...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-green-500/20 selection:text-green-400">
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default App;
