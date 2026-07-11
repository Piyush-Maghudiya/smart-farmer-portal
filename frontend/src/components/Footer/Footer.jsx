import React from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo";

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-950 border-t border-slate-900 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-900 pb-6">
                    <Link to="/">
                        <Logo />
                    </Link>
                    <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
                        <Link to="/" className="hover:text-green-500 transition-colors">Home</Link>
                        <Link to="/reviews" className="hover:text-green-500 transition-colors">Reviews</Link>
                        <Link to="/qa" className="hover:text-green-500 transition-colors">Q&A Forum</Link>
                        <a href="#" className="hover:text-green-500 transition-colors">Privacy Policy</a>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-xs text-slate-500">
                    <p>&copy; {currentYear} Smart Farmer Community Portal. All rights reserved.</p>
                    <p>Connecting farmers, sharing agricultural expertise, empowering growth.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
