import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { cropReviewService } from "../services/api";
import { Container, Select, Input } from "../components/index";
import ReviewCard from "../components/Reviews/ReviewCard";
import { Plus, Search, Camera, Star } from "lucide-react";

function CropGallery() {
    const { status: authStatus } = useSelector((state) => state.auth);
    const [searchParams] = useSearchParams();

    const [crops, setCrops] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState(searchParams.get("cropName") || "");
    const [stateFilter, setStateFilter] = useState("");
    const [seasonFilter, setSeasonFilter] = useState("");
    const [ratingFilter, setRatingFilter] = useState("");

    const fetchCrops = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 9,
                cropName: searchQuery || undefined,
                state: stateFilter || undefined,
                season: seasonFilter || undefined,
                rating: ratingFilter || undefined
            };
            const res = await cropReviewService.getAll(params);
            if (res.data.success) {
                setCrops(res.data.data.docs || res.data.data || []);
                setTotalPages(res.data.data.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to load crop photos:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCrops();
    }, [page, stateFilter, seasonFilter, ratingFilter]);

    const triggerSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchCrops();
    };

    return (
        <div className="py-12">
            <Container className="space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
                            <Camera className="text-green-500" size={28} />
                            Farmer Crop Gallery
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Browse crop photos shared by farmers. View details, leave reviews, and join discussions.
                        </p>
                    </div>
                    {authStatus && (
                        <Link
                            to="/share-crop"
                            className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/10"
                        >
                            <Plus size={16} /> Share Crop Photos
                        </Link>
                    )}
                </div>

                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                    <form onSubmit={triggerSearch} className="flex gap-3">
                        <Input
                            placeholder="Search by crop name (e.g. Rice, Wheat)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-5 rounded-xl flex items-center justify-center cursor-pointer"
                        >
                            <Search size={18} className="text-slate-300" />
                        </button>
                    </form>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        <Select
                            label="Rating:"
                            options={[
                                { label: "All Ratings", value: "" },
                                { label: "5 Stars", value: "5" },
                                { label: "4 Stars", value: "4" },
                                { label: "3 Stars", value: "3" }
                            ]}
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-96 rounded-2xl border border-slate-900/60 shimmer" />
                        ))}
                    </div>
                ) : crops.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {crops.map((crop) => (
                            <ReviewCard key={crop._id} review={crop} type="crop" />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-900/10 rounded-2xl border border-slate-900/60">
                        <Camera size={40} className="mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-400 text-sm">No crop photos found yet.</p>
                        {authStatus && (
                            <Link to="/share-crop" className="mt-4 inline-block text-xs font-bold text-green-500 hover:underline">
                                Be the first to share your crop photos
                            </Link>
                        )}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-slate-900">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="px-4 py-2 border border-slate-800 bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-40 cursor-pointer"
                        >
                            Previous
                        </button>
                        <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="px-4 py-2 border border-slate-800 bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-40 cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                )}
            </Container>
        </div>
    );
}

export default CropGallery;
