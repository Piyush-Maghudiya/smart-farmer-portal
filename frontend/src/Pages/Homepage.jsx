import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { cropReviewService, seedReviewService, fertilizerReviewService } from "../services/api";
import ReviewCard from "../components/Reviews/ReviewCard";
import { ArrowRight, Search, Sprout, ShieldAlert, Award } from "lucide-react";
import Container from "../components/container/Container";

function Homepage() {
    const navigate = useNavigate();
    const { status: authStatus } = useSelector((state) => state.auth);
    const [latestCrops, setLatestCrops] = useState([]);
    const [latestSeeds, setLatestSeeds] = useState([]);
    const [latestFertilizers, setLatestFertilizers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [cropsRes, seedsRes, fertRes] = await Promise.all([
                    cropReviewService.getAll({ limit: 3 }),
                    seedReviewService.getAll({ limit: 3 }),
                    fertilizerReviewService.getAll({ limit: 3 })
                ]);
                
                setLatestCrops(cropsRes.data.data?.docs || cropsRes.data.data || []);
                setLatestSeeds(seedsRes.data.data?.docs || seedsRes.data.data || []);
                setLatestFertilizers(fertRes.data.data?.docs || fertRes.data.data || []);
            } catch (error) {
                console.error("Failed to load homepage data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHomeData();
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim() !== "") {
            navigate(`/reviews?cropName=${searchQuery}`);
        }
    };

    return (
        <div className="pb-16">
            {/* Hero Section Banner */}
            <div className="relative overflow-hidden bg-slate-950 pt-20 pb-16 border-b border-slate-900">
                <div className="absolute inset-0 bg-radial-at-t from-green-500/10 via-transparent to-transparent pointer-events-none" />
                <Container className="text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-green-500/20">
                        <Sprout size={14} /> Farmer First Knowledge Sharing
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight max-w-4xl mx-auto">
                        Empowering Agriculture Through{" "}
                        <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                            Community Reviews
                        </span>
                    </h1>
                    <p className="text-slate-400 text-base sm:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
                        Read peer reviews on crops performance, seed brands, and fertilizers. Ask questions, share advice, and grow yield alongside fellow farmers.
                    </p>

                    {/* Unified Search Input Banner */}
                    <form onSubmit={handleSearchSubmit} className="mt-8 max-w-xl mx-auto flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1.5 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 transition-all duration-300">
                        <div className="flex items-center pl-3 text-slate-500">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by crop name (e.g. Rice, Potato)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none px-3 py-2.5 text-sm"
                        />
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                        >
                            Search Portal
                        </button>
                    </form>

                    {!authStatus && (
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <Link to="/signup" className="px-5 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/10 active:scale-[0.98] transition-all">
                                Join Now
                            </Link>
                            <Link to="/reviews" className="px-5 py-3 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl font-bold transition-all">
                                Browse Reviews
                            </Link>
                        </div>
                    )}
                </Container>
            </div>

            {/* Main Content Layout */}
            <Container className="mt-16 space-y-16">
                {/* Crop Reviews Section */}
                <section className="space-y-6">
                    <div className="flex items-end justify-between border-b border-slate-950 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                                🌾 Crop Sowing Reviews
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Latest reviews shared by farmers on seasonal crops, yields, and methods.</p>
                        </div>
                        <Link to="/reviews?tab=crop" className="text-xs font-bold text-green-500 hover:text-green-400 flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-96 rounded-2xl border border-slate-900/60 shimmer" />
                            ))}
                        </div>
                    ) : latestCrops.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {latestCrops.map((item) => (
                                <ReviewCard key={item._id} review={item} type="crop" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-900/10 rounded-2xl border border-slate-900/60">
                            <p className="text-slate-400 text-sm">No crop reviews published yet.</p>
                        </div>
                    )}
                </section>

                {/* Seed Reviews Section */}
                <section className="space-y-6">
                    <div className="flex items-end justify-between border-b border-slate-950 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                                🔬 Seed Brand Reviews
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Farmer experiences with seed germination rates and disease resistance.</p>
                        </div>
                        <Link to="/reviews?tab=seed" className="text-xs font-bold text-green-500 hover:text-green-400 flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-96 rounded-2xl border border-slate-900/60 shimmer" />
                            ))}
                        </div>
                    ) : latestSeeds.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {latestSeeds.map((item) => (
                                <ReviewCard key={item._id} review={item} type="seed" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-900/10 rounded-2xl border border-slate-900/60">
                            <p className="text-slate-400 text-sm">No seed brand reviews published yet.</p>
                        </div>
                    )}
                </section>

                {/* Fertilizer Reviews Section */}
                <section className="space-y-6">
                    <div className="flex items-end justify-between border-b border-slate-950 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                                🧪 Fertilizer Reviews
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Reviews on fertilizers effectiveness, usage methods, and crop outcomes.</p>
                        </div>
                        <Link to="/reviews?tab=fertilizer" className="text-xs font-bold text-green-500 hover:text-green-400 flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-96 rounded-2xl border border-slate-900/60 shimmer" />
                            ))}
                        </div>
                    ) : latestFertilizers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {latestFertilizers.map((item) => (
                                <ReviewCard key={item._id} review={item} type="fertilizer" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-900/10 rounded-2xl border border-slate-900/60">
                            <p className="text-slate-400 text-sm">No fertilizer reviews published yet.</p>
                        </div>
                    )}
                </section>
            </Container>
        </div>
    );
}

export default Homepage;
