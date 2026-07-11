import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { cropReviewService, seedReviewService, fertilizerReviewService } from "../services/api";
import { Container, Select, Input } from "../components/index";
import ReviewCard from "../components/Reviews/ReviewCard";
import { Plus, SlidersHorizontal, Search } from "lucide-react";

function AllReviews() {
    const { status: authStatus } = useSelector((state) => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "crop"; // crop, seed, fertilizer

    const [reviews, setReviews] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [stateFilter, setStateFilter] = useState("");
    const [districtFilter, setDistrictFilter] = useState("");
    const [ratingFilter, setRatingFilter] = useState("");
    const [seasonFilter, setSeasonFilter] = useState("");
    const [soilFilter, setSoilFilter] = useState("");

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 6,
                rating: ratingFilter || undefined
            };

            let res;
            if (activeTab === "crop") {
                params.cropName = searchQuery || undefined;
                params.state = stateFilter || undefined;
                params.district = districtFilter || undefined;
                params.season = seasonFilter || undefined;
                params.soilType = soilFilter || undefined;
                res = await cropReviewService.getAll(params);
            } else if (activeTab === "seed") {
                params.seedBrand = searchQuery || undefined;
                res = await seedReviewService.getAll(params);
            } else if (activeTab === "fertilizer") {
                params.fertilizerName = searchQuery || undefined;
                res = await fertilizerReviewService.getAll(params);
            }

            if (res.data.success) {
                setReviews(res.data.data.docs || res.data.data || []);
                setTotalPages(res.data.data.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to load reviews:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [activeTab, page, stateFilter, districtFilter, ratingFilter, seasonFilter, soilFilter]);

    const handleTabChange = (tabName) => {
        setSearchParams({ tab: tabName });
        setPage(1);
        setReviews([]);
    };

    const triggerSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchReviews();
    };

    return (
        <div className="py-12">
            <Container className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Agricultural Reviews</h1>
                        <p className="text-slate-400 text-sm mt-1">Read and write reviews on crop yields, seeds brands, and chemical inputs.</p>
                    </div>
                    {authStatus && (
                        <Link
                            to="/add-review"
                            className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/10 active:scale-[0.98]"
                        >
                            <Plus size={16} /> Write a Review
                        </Link>
                    )}
                </div>

                {/* Tabs Selector */}
                <div className="flex gap-2 border-b border-slate-900 pb-px">
                    <button
                        onClick={() => handleTabChange("crop")}
                        className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                            activeTab === "crop"
                                ? "border-green-500 text-green-500"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        🌾 Crop Reviews
                    </button>
                    <button
                        onClick={() => handleTabChange("seed")}
                        className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                            activeTab === "seed"
                                ? "border-green-500 text-green-500"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        🔬 Seed Reviews
                    </button>
                    <button
                        onClick={() => handleTabChange("fertilizer")}
                        className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                            activeTab === "fertilizer"
                                ? "border-green-500 text-green-500"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        🧪 Fertilizer Reviews
                    </button>
                </div>

                {/* Filters & Search Area */}
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                    <form onSubmit={triggerSearch} className="flex gap-3">
                        <Input
                            placeholder={`Search by ${activeTab === "crop" ? "crop name" : activeTab === "seed" ? "seed brand" : "fertilizer name"}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-5 rounded-xl flex items-center justify-center cursor-pointer transition-all"
                        >
                            <Search size={18} className="text-slate-300" />
                        </button>
                    </form>

                    {/* Advanced filter select drop-downs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <Select
                            label="Rating Range:"
                            options={[
                                { label: "All Ratings", value: "" },
                                { label: "5 Stars", value: "5" },
                                { label: "4 Stars", value: "4" },
                                { label: "3 Stars", value: "3" },
                                { label: "2 Stars", value: "2" },
                                { label: "1 Star", value: "1" }
                            ]}
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                        />

                        {activeTab === "crop" && (
                            <>
                                <Select
                                    label="Season:"
                                    options={[
                                        { label: "All Seasons", value: "" },
                                        { label: "Kharif", value: "Kharif" },
                                        { label: "Rabi", value: "Rabi" },
                                        { label: "Zaid", value: "Zaid" }
                                    ]}
                                    value={seasonFilter}
                                    onChange={(e) => setSeasonFilter(e.target.value)}
                                />
                                <Input
                                    label="State:"
                                    placeholder="e.g. Punjab"
                                    value={stateFilter}
                                    onChange={(e) => setStateFilter(e.target.value)}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Review Results */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-96 rounded-2xl border border-slate-900/60 shimmer" />
                        ))}
                    </div>
                ) : reviews.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reviews.map((r) => (
                            <ReviewCard key={r._id} review={r} type={activeTab} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-900/10 rounded-2xl border border-slate-900/60">
                        <p className="text-slate-400 text-sm">No reviews found matching the search filters.</p>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-slate-900">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-40 cursor-pointer"
                        >
                            Previous
                        </button>
                        <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-40 cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                )}
            </Container>
        </div>
    );
}

export default AllReviews;
