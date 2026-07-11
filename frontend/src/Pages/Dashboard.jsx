import React, { useEffect, useState } from "react";
import { dashboardService, bookmarkService } from "../services/api";
import { Container, Select } from "../components/index";
import { Heart, Star, FileText, Bookmark, HelpCircle, MessageCircle, MapPin, Phone } from "lucide-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

function Dashboard() {
    const { userData } = useSelector((state) => state.auth);
    const [stats, setStats] = useState(null);
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, bookmarksRes] = await Promise.all([
                    dashboardService.getStats(),
                    bookmarkService.getAll()
                ]);
                setStats(statsRes.data.data);
                setBookmarks(bookmarksRes.data.data?.docs || bookmarksRes.data.data || []);
            } catch (err) {
                setError("Failed to load dashboard metrics");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const removeSavedBookmark = async (bookmarkId) => {
        try {
            await bookmarkService.remove(bookmarkId);
            setBookmarks(bookmarks.filter(b => b._id !== bookmarkId));
            if (stats) {
                setStats({
                    ...stats,
                    personalStats: {
                        ...stats.personalStats,
                        bookmarksCount: Math.max(0, stats.personalStats.bookmarksCount - 1)
                    }
                });
            }
        } catch (err) {
            console.error("Failed to delete bookmark:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const personal = stats?.personalStats || {};
    const reviewStats = personal.reviewsCount || {};

    return (
        <div className="py-12">
            <Container className="space-y-10">
                {/* Profile Card Header */}
                {userData && (
                    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
                        {userData.avatar?.url ? (
                            <img
                                src={userData.avatar.url}
                                alt={userData.fullname}
                                className="w-24 h-24 rounded-full object-cover border-2 border-green-500/30"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-slate-800 text-slate-100 flex items-center justify-center text-3xl font-bold">
                                {userData.fullname?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="text-center sm:text-left space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-100">{userData.fullname}</h1>
                                <span className="mx-auto sm:mx-0 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wider">
                                    {userData.role}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400">@{userData.username} • {userData.email}</p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1">
                                <span className="flex items-center gap-1">
                                    <MapPin size={14} className="text-slate-500" />
                                    {userData.village}, {userData.district}, {userData.state}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Phone size={14} className="text-slate-500" />
                                    {userData.phone}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metrics Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
                    <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                        <FileText size={20} className="text-green-500 mb-2" />
                        <div>
                            <p className="text-2xl font-bold text-slate-100">{reviewStats.total || 0}</p>
                            <p className="text-xs font-semibold text-slate-400 mt-1">Reviews Published</p>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 block">
                            {reviewStats.crop || 0} Crops • {reviewStats.seed || 0} Seeds
                        </span>
                    </div>

                    <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                        <Heart size={20} className="text-red-500 mb-2 fill-red-500/10" />
                        <div>
                            <p className="text-2xl font-bold text-slate-100">{personal.totalLikesReceived || 0}</p>
                            <p className="text-xs font-semibold text-slate-400 mt-1">Likes Received</p>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 block">On all contributions</span>
                    </div>

                    <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                        <Bookmark size={20} className="text-blue-500 mb-2 fill-blue-500/10" />
                        <div>
                            <p className="text-2xl font-bold text-slate-100">{personal.bookmarksCount || 0}</p>
                            <p className="text-xs font-semibold text-slate-400 mt-1">Reviews Bookmarked</p>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 block">Saved reviews</span>
                    </div>

                    <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                        <HelpCircle size={20} className="text-yellow-500 mb-2" />
                        <div>
                            <p className="text-2xl font-bold text-slate-100">{personal.questionsAsked || 0}</p>
                            <p className="text-xs font-semibold text-slate-400 mt-1">Questions Asked</p>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 block">Community Q&A</span>
                    </div>

                    <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                        <MessageCircle size={20} className="text-purple-500 mb-2" />
                        <div>
                            <p className="text-2xl font-bold text-slate-100">{personal.answersGiven || 0}</p>
                            <p className="text-xs font-semibold text-slate-400 mt-1">Answers Given</p>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 block">Expert comments</span>
                    </div>
                </div>

                {/* Dashboard Bookmarks / Saved Content */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-3">
                        <Bookmark size={20} className="text-green-500 fill-green-500/10" /> Bookmarked Reviews
                    </h2>

                    {bookmarks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {bookmarks.map((b) => {
                                const isCrop = !!b.cropReview;
                                const isSeed = !!b.seedReview;
                                const isFert = !!b.fertilizerReview;
                                
                                let targetReview = b.cropReview || b.seedReview || b.fertilizerReview;
                                if (!targetReview) return null;

                                let typeLabel = "Crop Review";
                                let pathType = "crop";
                                let rating = targetReview.rating || 5;

                                if (isSeed) {
                                    typeLabel = "Seed Review";
                                    pathType = "seed";
                                } else if (isFert) {
                                    typeLabel = "Fertilizer Review";
                                    pathType = "fertilizer";
                                }

                                const title = targetReview.cropName || targetReview.fertilizerName || targetReview.seedBrand;

                                return (
                                    <div key={b._id} className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex justify-between items-start">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded">
                                                {typeLabel}
                                            </span>
                                            <Link to={`/reviews/${pathType}/${targetReview._id}`}>
                                                <h4 className="text-base font-bold text-slate-100 hover:text-green-400 transition-colors line-clamp-1">
                                                    {title}
                                                </h4>
                                            </Link>
                                            <p className="text-xs text-slate-400 line-clamp-2">{targetReview.description}</p>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        className={i < rating ? "fill-yellow-500 text-yellow-500" : "text-slate-800"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeSavedBookmark(b._id)}
                                            className="text-xs font-bold text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl border border-red-500/20 transition-all cursor-pointer whitespace-nowrap"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-slate-900/10 border border-slate-900/60 rounded-2xl">
                            <p className="text-slate-400 text-sm">No reviews bookmarked yet.</p>
                            <Link to="/reviews" className="mt-4 inline-block text-xs font-bold text-green-500 hover:underline">
                                Browse portal reviews
                            </Link>
                        </div>
                    )}
                </section>
            </Container>
        </div>
    );
}

export default Dashboard;
