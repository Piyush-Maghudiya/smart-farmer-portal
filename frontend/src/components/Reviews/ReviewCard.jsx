import React from "react";
import { Link } from "react-router-dom";
import { Star, MessageCircle, Heart, Tag, MapPin } from "lucide-react";
import { isVideoUrl } from "../../utils/media";

function ReviewCard({ review, type = "crop" }) {
    // Determine dynamic values depending on review type (crop, seed, fertilizer)
    let title = "";
    let sub = "";
    let badgeText = "";
    let rating = review.rating || 0;
    
    if (type === "crop") {
        title = review.cropName;
        sub = `Season: ${review.season} • Soil: ${review.soilType}`;
        badgeText = `${review.expectedYield || "N/A"} Expected`;
    } else if (type === "seed") {
        title = `${review.seedBrand} (${review.cropName})`;
        sub = `Germination: ${review.germinationRate} • Disease Res: ${review.diseaseResistance}`;
        badgeText = `₹${review.price}`;
    } else if (type === "fertilizer") {
        title = review.fertilizerName;
        sub = `Suitable for: ${review.suitableCrop} • Effect: ${review.effectiveness}`;
        badgeText = review.price ? `₹${review.price}` : "";
    }

    const detailUrl = type === "crop" ? `/crops/${review._id}` : `/reviews/${type}/${review._id}`;

    return (
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-2xl">
            {/* Header Image/Video or Placeholder */}
            <div className="relative h-44 bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-900/60">
                {review.images && review.images.length > 0 ? (
                    (() => {
                        const isVideo = isVideoUrl(review.images[0].url);
                        return isVideo ? (
                            <div className="w-full h-full relative bg-black flex items-center justify-center">
                                <video
                                    src={review.images[0].url}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    loop
                                    autoPlay
                                />
                                <div className="absolute bottom-2 left-2 flex items-center justify-center">
                                    <span className="text-[10px] bg-slate-950/70 border border-slate-800 text-slate-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                        🎥 Video
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <img
                                src={review.images[0].url}
                                alt={title}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                        );
                    })()
                ) : (
                    <span className="text-4xl">🌾</span>
                )}
                {badgeText && (
                    <span className="absolute top-3 right-3 text-[11px] font-bold text-slate-950 bg-green-400 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {badgeText}
                    </span>
                )}
            </div>

            {/* Content Body */}
            <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-1 text-yellow-500 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                size={14}
                                className={i < rating ? "fill-yellow-500 text-yellow-500" : "text-slate-700"}
                            />
                        ))}
                        <span className="text-xs text-slate-400 ml-1 font-semibold">({rating})</span>
                    </div>

                    <Link to={detailUrl}>
                        <h3 className="text-lg font-bold text-slate-100 hover:text-green-400 transition-colors line-clamp-1">
                            {title}
                        </h3>
                    </Link>
                    
                    <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                        <Tag size={12} className="text-slate-500" />
                        {sub}
                    </p>
                    
                    <p className="text-slate-300 text-sm mt-3 line-clamp-2 leading-relaxed">
                        {review.description}
                    </p>
                </div>

                {/* Footer Details */}
                <div className="mt-5 pt-4 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        {review.ownerDetails?.avatar?.url ? (
                            <img
                                src={review.ownerDetails.avatar.url}
                                alt={review.ownerDetails.fullname}
                                className="w-6 h-6 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                                {review.ownerDetails?.fullname?.charAt(0).toUpperCase() || "F"}
                            </div>
                        )}
                        <span className="font-semibold line-clamp-1">{review.ownerDetails?.fullname || "Farmer"}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {review.peerReviewsCount > 0 && (
                            <span className="flex items-center gap-1 text-yellow-500" title="Community reviews">
                                <Star size={13} className="fill-yellow-500" />
                                {Math.round(review.avgPeerRating * 10) / 10 || review.avgPeerRating}
                            </span>
                        )}
                        <span className="flex items-center gap-1 hover:text-green-500 transition-colors">
                            <Heart size={13} className="text-red-500 fill-red-500/10" />
                            {review.likesCount || 0}
                        </span>
                        <span className="flex items-center gap-1 hover:text-green-500 transition-colors">
                            <MessageCircle size={13} className="text-slate-500" />
                            {review.commentsCount || 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReviewCard;
