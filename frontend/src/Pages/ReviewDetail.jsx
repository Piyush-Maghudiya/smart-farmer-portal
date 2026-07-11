import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { cropReviewService, seedReviewService, fertilizerReviewService, commentService, bookmarkService } from "../services/api";
import { Container, Button, Input, Select } from "../components/index";
import { Star, Heart, Bookmark, Trash2, Edit3, MessageCircle, Calendar, MapPin, HelpCircle } from "lucide-react";
import { isVideoUrl } from "../utils/media";

function ReviewDetail({ cropOnly = false }) {
    const params = useParams();
    const type = cropOnly ? "crop" : params.type;
    const id = cropOnly ? params.id : params.id;
    const navigate = useNavigate();
    const { status: authStatus, userData } = useSelector((state) => state.auth);

    const [review, setReview] = useState(null);
    const [comments, setComments] = useState([]);
    const [peerReviews, setPeerReviews] = useState([]);
    const [peerSummary, setPeerSummary] = useState({ avgRating: 0, count: 0 });
    const [userPeerReview, setUserPeerReview] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [peerRating, setPeerRating] = useState("5");
    const [peerReviewText, setPeerReviewText] = useState("");
    const [submittingPeerReview, setSubmittingPeerReview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [error, setError] = useState("");

    // Fetch review and comments
    const fetchReviewData = async () => {
        try {
            let res;
            if (type === "crop") res = await cropReviewService.getById(id);
            else if (type === "seed") res = await seedReviewService.getById(id);
            else if (type === "fertilizer") res = await fertilizerReviewService.getById(id);

            if (res.data.success) {
                setReview(res.data.data);
            }

            // Fetch comments
            const commentsRes = await commentService.get(type, id);
            if (commentsRes.data.success) {
                setComments(commentsRes.data.data.docs || commentsRes.data.data || []);
            }

            // Fetch peer reviews for crop posts
            if (type === "crop") {
                const peerRes = await cropReviewService.getPeerReviews(id);
                if (peerRes.data.success) {
                    const data = peerRes.data.data;
                    setPeerReviews(data.docs || []);
                    setPeerSummary(data.summary || { avgRating: 0, count: 0 });
                    setUserPeerReview(data.userReview || null);
                }
            }
        } catch (err) {
            setError("Review details could not be found.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviewData();
    }, [type, id]);

    const handleLike = async () => {
        if (!authStatus) {
            navigate("/login");
            return;
        }
        try {
            let res;
            if (type === "crop") res = await cropReviewService.toggleLike(id);
            else if (type === "seed") res = await seedReviewService.toggleLike(id);
            else if (type === "fertilizer") res = await fertilizerReviewService.toggleLike(id);

            if (res.data.success) {
                const isLiked = res.data.data.isLiked;
                setReview((prev) => ({
                    ...prev,
                    isLiked,
                    likesCount: prev.likesCount + (isLiked ? 1 : -1)
                }));
            }
        } catch (err) {
            console.error("Like toggle failed:", err);
        }
    };

    const handleBookmark = async () => {
        if (!authStatus) {
            navigate("/login");
            return;
        }
        try {
            const res = await bookmarkService.add(type, id);
            if (res.data.success) {
                alert("Review bookmarked successfully!");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Already bookmarked!");
        }
    };

    const handlePostPeerReview = async (e) => {
        e.preventDefault();
        if (!peerReviewText.trim()) return;

        if (!authStatus) {
            navigate("/login");
            return;
        }

        setSubmittingPeerReview(true);
        try {
            const res = await cropReviewService.addPeerReview(id, {
                rating: peerRating,
                review: peerReviewText.trim()
            });
            if (res.data.success) {
                setPeerReviewText("");
                const peerRes = await cropReviewService.getPeerReviews(id);
                if (peerRes.data.success) {
                    const data = peerRes.data.data;
                    setPeerReviews(data.docs || []);
                    setPeerSummary(data.summary || { avgRating: 0, count: 0 });
                    setUserPeerReview(data.userReview || null);
                }
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to post review");
        } finally {
            setSubmittingPeerReview(false);
        }
    };

    const handleDeletePeerReview = async (peerReviewId) => {
        if (!window.confirm("Delete your review?")) return;
        try {
            await cropReviewService.deletePeerReview(id, peerReviewId);
            setPeerReviews(peerReviews.filter((r) => r._id !== peerReviewId));
            setUserPeerReview(null);
            const peerRes = await cropReviewService.getPeerReviews(id);
            if (peerRes.data.success) {
                setPeerSummary(peerRes.data.data.summary || { avgRating: 0, count: 0 });
            }
        } catch (err) {
            console.error("Failed to delete peer review:", err);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmittingComment(true);
        try {
            const res = await commentService.add(type, id, newComment.trim());
            if (res.data.success) {
                setNewComment("");
                // Reload comments
                const commentsRes = await commentService.get(type, id);
                setComments(commentsRes.data.data.docs || commentsRes.data.data || []);
            }
        } catch (err) {
            console.error("Failed to post comment:", err);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await commentService.delete(commentId);
            setComments(comments.filter((c) => c._id !== commentId));
        } catch (err) {
            console.error("Failed to delete comment:", err);
        }
    };

    const handleDeleteReview = async () => {
        if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
        try {
            if (type === "crop") await cropReviewService.delete(id);
            else if (type === "seed") await seedReviewService.delete(id);
            else if (type === "fertilizer") await fertilizerReviewService.delete(id);

            navigate(cropOnly ? "/crops" : "/reviews");
        } catch (err) {
            console.error("Failed to delete review:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !review) {
        return (
            <Container className="py-20 text-center">
                <p className="text-red-500 text-base">{error || "Review not found"}</p>
                <Link to={cropOnly ? "/crops" : "/reviews"} className="text-green-500 font-bold hover:underline mt-4 inline-block">Back to {cropOnly ? "Crop Gallery" : "Reviews"}</Link>
            </Container>
        );
    }

    const isOwner = userData && review.ownerDetails?._id === userData._id;
    const isAdmin = userData && userData.role === "admin";
    const dateFormatted = new Date(review.createdAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    });

    return (
        <div className="py-12">
            <Container className="space-y-8">
                {/* Back Link */}
                <Link to={cropOnly ? "/crops" : "/reviews"} className="text-sm font-bold text-green-500 hover:text-green-400">
                    ← Back to {cropOnly ? "Crop Gallery" : "Reviews"}
                </Link>

                {/* Main Details Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left 2 Cols: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
                            {/* Title & Metadata */}
                            <div className="space-y-4">
                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2.5 py-1 rounded">
                                    {type} Review
                                </span>
                                <h1 className="text-3xl font-extrabold text-slate-100 leading-tight">
                                    {review.cropName || review.fertilizerName || review.seedBrand}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-slate-500" />
                                        {dateFormatted}
                                    </span>
                                    {review.state && (
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-slate-500" />
                                            {review.district}, {review.state}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Ratings Stars */}
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-1.5 text-yellow-500">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            size={20}
                                            className={i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-slate-700"}
                                        />
                                    ))}
                                    <span className="text-sm text-slate-400 font-bold ml-1">Farmer rating ({review.rating}/5)</span>
                                </div>
                                {type === "crop" && peerSummary.count > 0 && (
                                    <div className="flex items-center gap-1.5 text-emerald-400">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                size={16}
                                                className={i < Math.round(peerSummary.avgRating) ? "fill-emerald-400 text-emerald-400" : "text-slate-700"}
                                            />
                                        ))}
                                        <span className="text-sm text-slate-400 font-bold">
                                            Community ({peerSummary.avgRating}/5 · {peerSummary.count} reviews)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Specific Attribute Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/40 text-xs">
                                {type === "crop" && (
                                    <>
                                        <div>
                                            <span className="text-slate-500 block font-semibold mb-0.5">Season:</span>
                                            <span className="text-slate-200 font-bold">{review.season}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold mb-0.5">Soil Type:</span>
                                            <span className="text-slate-200 font-bold">{review.soilType}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold mb-0.5">Irrigation:</span>
                                            <span className="text-slate-200 font-bold">{review.irrigationMethod}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold mb-0.5">Fertilizers:</span>
                                            <span className="text-slate-200 font-bold">{review.fertilizerUsed}</span>
                                        </div>
                                        {review.expectedYield && (
                                            <div>
                                                <span className="text-slate-500 block font-semibold mb-0.5">Expected Yield:</span>
                                                <span className="text-slate-200 font-bold">{review.expectedYield}</span>
                                            </div>
                                        )}
                                        {review.actualYield && (
                                            <div>
                                                <span className="text-slate-500 block font-semibold mb-0.5">Actual Yield:</span>
                                                <span className="text-slate-200 font-bold">{review.actualYield}</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {type === "seed" && (
                                    <>
                                        <div>
                                            <span className="text-slate-500 block font-semibold mb-0.5">Crop Category:</span>
                                            <span className="text-slate-200 font-bold">{review.cropName}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold mb-0.5">Germination Rate:</span>
                                            <span className="text-slate-200 font-bold">{review.germinationRate}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold mb-0.5">Disease Resistance:</span>
                                            <span className="text-slate-200 font-bold">{review.diseaseResistance}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold mb-0.5">Price:</span>
                                            <span className="text-slate-200 font-bold">₹{review.price}</span>
                                        </div>
                                    </>
                                )}

                                {type === "fertilizer" && (
                                    <>
                                        <div>
                                            <span className="text-slate-500 block font-semibold mb-0.5">Suitable Crop:</span>
                                            <span className="text-slate-200 font-bold">{review.suitableCrop}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold mb-0.5">Usage Method:</span>
                                            <span className="text-slate-200 font-bold">{review.usageMethod}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold mb-0.5">Effectiveness:</span>
                                            <span className="text-slate-200 font-bold">{review.effectiveness}</span>
                                        </div>
                                        {review.price && (
                                            <div>
                                                <span className="text-slate-500 block font-semibold mb-0.5">Price:</span>
                                                <span className="text-slate-200 font-bold">₹{review.price}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Farmer Experience Review</h3>
                                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{review.description}</p>
                            </div>

                            {/* Action Buttons: Like / Bookmark / Ask Q&A */}
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-800/40">
                                <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                                        review.isLiked
                                            ? "bg-red-500/10 border-red-500/30 text-red-500"
                                            : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                                    }`}
                                >
                                    <Heart size={16} className={review.isLiked ? "fill-red-500" : ""} />
                                    {review.isLiked ? "Liked" : "Like"} ({review.likesCount || 0})
                                </button>
                                <button
                                    onClick={handleBookmark}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-sm font-bold transition-all cursor-pointer"
                                >
                                    <Bookmark size={16} /> Bookmark
                                </button>
                                {type === "crop" && (
                                    <Link
                                        to={`/qa?ask=1&crop=${encodeURIComponent(review.cropName)}`}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-green-500/30 text-slate-300 hover:text-green-400 text-sm font-bold transition-all"
                                    >
                                        <HelpCircle size={16} /> Ask About This Crop
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Peer Reviews — other farmers review this crop post */}
                        {type === "crop" && (
                            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
                                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                    <Star size={20} className="text-yellow-500 fill-yellow-500" />
                                    Farmer Reviews ({peerSummary.count})
                                </h3>

                                {authStatus && !isOwner && !userPeerReview && (
                                    <form onSubmit={handlePostPeerReview} className="space-y-4 bg-slate-950/30 p-4 rounded-xl border border-slate-800/60">
                                        <p className="text-xs text-slate-400">Share your opinion on this farmer&apos;s crop post</p>
                                        <Select
                                            label="Your Rating:"
                                            options={["5", "4", "3", "2", "1"]}
                                            value={peerRating}
                                            onChange={(e) => setPeerRating(e.target.value)}
                                        />
                                        <textarea
                                            className="w-full px-4 py-2.5 min-h-[80px] rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                            placeholder="Write your review — yield quality, technique, advice for others..."
                                            value={peerReviewText}
                                            onChange={(e) => setPeerReviewText(e.target.value)}
                                            required
                                        />
                                        <Button type="submit" disabled={submittingPeerReview} className="bg-green-600 hover:bg-green-500">
                                            {submittingPeerReview ? "Posting..." : "Submit Review"}
                                        </Button>
                                    </form>
                                )}

                                {!authStatus && (
                                    <p className="text-xs text-slate-400 text-center py-2">
                                        <Link to="/login" className="text-green-500 font-bold hover:underline">Sign in</Link> to review this crop post
                                    </p>
                                )}

                                <div className="space-y-4">
                                    {peerReviews.length > 0 ? (
                                        peerReviews.map((pr) => {
                                            const isReviewer = userData && pr.reviewerDetails?._id === userData._id;
                                            return (
                                                <div key={pr._id} className="p-4 bg-slate-950/20 rounded-xl border border-slate-900/40 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-200">
                                                                {pr.reviewerDetails?.fullname || "Farmer"}
                                                            </span>
                                                            <div className="flex items-center gap-0.5 text-yellow-500">
                                                                {Array.from({ length: 5 }).map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        size={12}
                                                                        className={i < pr.rating ? "fill-yellow-500 text-yellow-500" : "text-slate-700"}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-slate-500">
                                                                {new Date(pr.createdAt).toLocaleDateString()}
                                                            </span>
                                                            {isReviewer && (
                                                                <button
                                                                    onClick={() => handleDeletePeerReview(pr._id)}
                                                                    className="text-slate-500 hover:text-red-500 cursor-pointer"
                                                                    title="Delete review"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-300 text-sm">{pr.review}</p>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-slate-500 text-center py-4">No farmer reviews yet. Be the first to review!</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Comments Thread Section */}
                        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
                            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                <MessageCircle size={20} className="text-green-500" /> Discussion ({comments.length})
                            </h3>

                            {/* Add Comment Form */}
                            {authStatus ? (
                                <form onSubmit={handlePostComment} className="flex gap-3">
                                    <Input
                                        placeholder="Add to the farming advice thread..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    />
                                    <Button type="submit" disabled={submittingComment} className="bg-green-600 hover:bg-green-500">
                                        Post
                                    </Button>
                                </form>
                            ) : (
                                <p className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 text-center">
                                    Please <Link to="/login" className="text-green-500 font-bold hover:underline">sign in</Link> to contribute to the discussion.
                                </p>
                            )}

                            {/* Comments Listing */}
                            <div className="space-y-4 pt-4 border-t border-slate-800/40">
                                {comments.length > 0 ? (
                                    comments.map((comment) => {
                                        const isCommentOwner = userData && comment.ownerDetails?._id === userData._id;
                                        return (
                                            <div key={comment._id} className="flex items-start gap-3 p-4 bg-slate-950/20 rounded-xl border border-slate-900/40">
                                                <div className="flex-grow space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-200">
                                                            {comment.ownerDetails?.fullname || "Farmer"}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">
                                                            {new Date(comment.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-300 text-sm">{comment.content}</p>
                                                </div>
                                                {(isCommentOwner || isAdmin) && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        className="text-slate-500 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                                                        title="Delete comment"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-slate-500 py-6 text-center">No comments posted yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right 1 Col: Image Gallery / Owner Info / Admin controls */}
                    <div className="space-y-6">
                        {/* Media Gallery */}
                        {review.images && review.images.length > 0 && (
                            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Media Gallery</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {review.images.map((img) => {
                                        const isVideo = isVideoUrl(img.url);
                                        return isVideo ? (
                                            <div key={img.public_id} className="relative rounded-xl overflow-hidden border border-slate-800 bg-black">
                                                <video
                                                    src={img.url}
                                                    controls
                                                    className="w-full h-auto max-h-[300px] object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <a href={img.url} target="_blank" rel="noopener noreferrer" key={img.public_id}>
                                                <img
                                                    src={img.url}
                                                    alt="Review attachment"
                                                    className="w-full h-auto rounded-xl object-cover hover:opacity-80 transition-opacity border border-slate-800"
                                                />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Owner card */}
                        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4 text-center">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Posted By</h4>
                            <div className="flex flex-col items-center gap-3">
                                {review.ownerDetails?.avatar?.url ? (
                                    <img
                                        src={review.ownerDetails.avatar.url}
                                        alt={review.ownerDetails.fullname}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-green-500/20"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center font-bold text-2xl text-slate-300">
                                        {review.ownerDetails?.fullname?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h5 className="font-bold text-slate-100">{review.ownerDetails?.fullname}</h5>
                                    <span className="inline-block text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase mt-1">
                                        {review.ownerDetails?.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Admin / Owner Actions */}
                        {(isOwner || isAdmin) && (
                            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Author Controls</h4>
                                <div className="grid grid-cols-1 gap-2.5">
                                    <Link
                                        to={`/reviews/${type}/${id}/edit`}
                                        className="w-full py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-sm font-bold transition-all"
                                    >
                                        <Edit3 size={16} /> Edit Review
                                    </Link>
                                    <button
                                        onClick={handleDeleteReview}
                                        className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer"
                                    >
                                        <Trash2 size={16} /> Delete Review
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    );
}

export default ReviewDetail;
