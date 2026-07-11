import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { seedReviewService, fertilizerReviewService } from "../services/api";
import { Container, Select, Input } from "../components/index";
import ReviewCard from "../components/Reviews/ReviewCard";
import { Plus, Search, Store, Sparkles } from "lucide-react";

function AgroMarketplace() {
    const { status: authStatus, userData } = useSelector((state) => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "seed"; // seed, fertilizer

    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [ratingFilter, setRatingFilter] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("newest"); // newest, priceAsc, priceDesc

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 9,
                rating: ratingFilter || undefined
            };

            let res;
            if (activeTab === "seed") {
                params.seedBrand = searchQuery || undefined;
                res = await seedReviewService.getAll(params);
            } else if (activeTab === "fertilizer") {
                params.fertilizerName = searchQuery || undefined;
                res = await fertilizerReviewService.getAll(params);
            }

            if (res?.data?.success) {
                let fetchedDocs = res.data.data.docs || res.data.data || [];
                
                // Client-side additional price filter if set
                if (maxPrice && !isNaN(Number(maxPrice))) {
                    fetchedDocs = fetchedDocs.filter(p => p.price && Number(p.price) <= Number(maxPrice));
                }

                // Client-side sorting
                if (sortBy === "priceAsc") {
                    fetchedDocs.sort((a, b) => (a.price || 0) - (b.price || 0));
                } else if (sortBy === "priceDesc") {
                    fetchedDocs.sort((a, b) => (b.price || 0) - (a.price || 0));
                } // newest is default sorted by backend (createdAt desc)

                setProducts(fetchedDocs);
                setTotalPages(res.data.data.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to load products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [activeTab, page, ratingFilter, maxPrice, sortBy]);

    const handleTabChange = (tabName) => {
        setSearchParams({ tab: tabName });
        setPage(1);
        setProducts([]);
        setSearchQuery("");
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    const isSellerOrAdmin = userData && (userData.role === "seller" || userData.role === "admin");

    return (
        <div className="py-12">
            <Container className="space-y-8">
                {/* Header Banner */}
                <div className="relative overflow-hidden glass-panel p-8 sm:p-10 rounded-3xl border border-slate-900 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="space-y-2 relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                            <Sparkles size={12} /> Agro Store Catalog
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
                            <Store className="text-green-500" size={32} /> Seeds & Fertilizers Hub
                        </h1>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Discover premium quality seeds and highly effective fertilizer products listed directly by verified sellers. Ask questions, view ratings, check community feedback, and select the best for your fields.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 relative z-10 w-full md:w-auto">
                        {authStatus ? (
                            isSellerOrAdmin ? (
                                <Link
                                    to="/upload-product"
                                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/20 active:scale-[0.98] whitespace-nowrap text-sm"
                                >
                                    <Plus size={18} /> Upload Product Listing
                                </Link>
                            ) : (
                                <div className="text-center p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl max-w-xs md:max-w-sm">
                                    <p className="text-xs text-slate-400">
                                        Are you an Agro Company/Seller? Register/upgrade your account role to start uploading your products.
                                    </p>
                                </div>
                            )
                        ) : (
                            <Link
                                to="/login?redirect=/marketplace"
                                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl font-bold transition-all whitespace-nowrap text-sm"
                            >
                                Sign in to Upload Products
                            </Link>
                        )}
                    </div>
                </div>

                {/* Catalog Tabs */}
                <div className="flex gap-2 border-b border-slate-900 pb-px">
                    <button
                        onClick={() => handleTabChange("seed")}
                        className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                            activeTab === "seed"
                                ? "border-green-500 text-green-500"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        🌱 Seeds Catalog
                    </button>
                    <button
                        onClick={() => handleTabChange("fertilizer")}
                        className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                            activeTab === "fertilizer"
                                ? "border-green-500 text-green-500"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        🧪 Fertilizers Catalog
                    </button>
                </div>

                {/* Advanced Marketplace Filters */}
                <div className="bg-slate-900/20 p-6 rounded-2xl border border-slate-900 space-y-4">
                    <form onSubmit={handleSearchSubmit} className="flex gap-3">
                        <div className="relative flex-grow">
                            <input
                                placeholder={`Search catalog by ${activeTab === "seed" ? "seed brand or crop type" : "fertilizer name"}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-5 py-3 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-100 placeholder-slate-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-6 rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-sm"
                        >
                            <Search size={18} className="text-slate-300" />
                        </button>
                    </form>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <Select
                            label="Rating Filter:"
                            options={[
                                { label: "All Ratings", value: "" },
                                { label: "5 Stars Only", value: "5" },
                                { label: "4 Stars & Above", value: "4" },
                                { label: "3 Stars & Above", value: "3" }
                            ]}
                            value={ratingFilter}
                            onChange={(e) => {
                                setRatingFilter(e.target.value);
                                setPage(1);
                            }}
                        />

                        <Input
                            label="Max Price (₹):"
                            type="number"
                            placeholder="e.g. 500"
                            value={maxPrice}
                            onChange={(e) => {
                                setMaxPrice(e.target.value);
                                setPage(1);
                            }}
                        />

                        <Select
                            label="Sort By:"
                            options={[
                                { label: "Newest Listings", value: "newest" },
                                { label: "Price: Low to High", value: "priceAsc" },
                                { label: "Price: High to Low", value: "priceDesc" }
                            ]}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        />
                    </div>
                </div>

                {/* Catalog Listing */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-96 rounded-2xl border border-slate-900/60 bg-slate-900/10 shimmer animate-pulse" />
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((item) => (
                            <ReviewCard key={item._id} review={item} type={activeTab} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-slate-900/5 rounded-2xl border border-slate-900/40">
                        <p className="text-slate-400 text-sm">No products found matching the current search parameters.</p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setRatingFilter("");
                                setMaxPrice("");
                                setSortBy("newest");
                            }}
                            className="text-green-500 hover:text-green-400 text-xs font-bold mt-2 underline"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-12 pt-6 border-t border-slate-900">
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

export default AgroMarketplace;
