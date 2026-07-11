import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import CropReview from "../models/cropReview.models.js";
import CropPeerReview from "../models/cropPeerReview.models.js";

const addPeerReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, review } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid crop post ID");
    }

    if (!rating || !review?.trim()) {
        throw new ApiError(400, "Rating and review text are required");
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    const cropPost = await CropReview.findById(id);
    if (!cropPost) {
        throw new ApiError(404, "Crop post not found");
    }

    if (cropPost.owner.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot review your own crop post");
    }

    const existing = await CropPeerReview.findOne({
        cropReview: id,
        reviewer: req.user._id
    });

    if (existing) {
        throw new ApiError(409, "You have already reviewed this crop post. Delete your review to post a new one.");
    }

    const peerReview = await CropPeerReview.create({
        cropReview: id,
        reviewer: req.user._id,
        rating: ratingNum,
        review: review.trim()
    });

    return res
        .status(201)
        .json(new ApiResponse(201, peerReview, "Peer review added successfully"));
});

const getPeerReviews = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid crop post ID");
    }

    const peerReviewAggregate = CropPeerReview.aggregate([
        { $match: { cropReview: new mongoose.Types.ObjectId(id) } },
        {
            $lookup: {
                from: "users",
                localField: "reviewer",
                foreignField: "_id",
                as: "reviewerDetails"
            }
        },
        { $unwind: "$reviewerDetails" },
        {
            $project: {
                rating: 1,
                review: 1,
                createdAt: 1,
                "reviewerDetails.fullname": 1,
                "reviewerDetails.avatar": 1,
                "reviewerDetails.role": 1,
                "reviewerDetails._id": 1
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const reviews = await CropPeerReview.aggregatePaginate(peerReviewAggregate, options);

    const stats = await CropPeerReview.aggregate([
        { $match: { cropReview: new mongoose.Types.ObjectId(id) } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: "$rating" },
                count: { $sum: 1 }
            }
        }
    ]);

    const summary = stats[0]
        ? { avgRating: Math.round(stats[0].avgRating * 10) / 10, count: stats[0].count }
        : { avgRating: 0, count: 0 };

    let userReview = null;
    if (req.user?._id) {
        userReview = await CropPeerReview.findOne({
            cropReview: id,
            reviewer: req.user._id
        });
    }

    return res.status(200).json(
        new ApiResponse(200, { ...reviews, summary, userReview }, "Peer reviews fetched successfully")
    );
});

const deletePeerReview = asyncHandler(async (req, res) => {
    const { peerReviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(peerReviewId)) {
        throw new ApiError(400, "Invalid peer review ID");
    }

    const peerReview = await CropPeerReview.findById(peerReviewId);
    if (!peerReview) {
        throw new ApiError(404, "Peer review not found");
    }

    if (
        peerReview.reviewer.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
    ) {
        throw new ApiError(403, "You do not have permission to delete this review");
    }

    await CropPeerReview.findByIdAndDelete(peerReviewId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Peer review deleted successfully"));
});

export { addPeerReview, getPeerReviews, deletePeerReview };
