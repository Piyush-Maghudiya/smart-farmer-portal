import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Bookmark from "../models/bookmark.models.js";

const addBookmark = asyncHandler(async (req, res) => {
    const { cropReviewId, seedReviewId, fertilizerReviewId } = req.body;

    if (!cropReviewId && !seedReviewId && !fertilizerReviewId) {
        throw new ApiError(400, "At least one review ID (crop, seed, or fertilizer) must be provided to bookmark");
    }

    const query = { owner: req.user._id };
    if (cropReviewId) query.cropReview = cropReviewId;
    else if (seedReviewId) query.seedReview = seedReviewId;
    else if (fertilizerReviewId) query.fertilizerReview = fertilizerReviewId;

    const existingBookmark = await Bookmark.findOne(query);
    if (existingBookmark) {
        throw new ApiError(409, "Review is already bookmarked");
    }

    const bookmark = await Bookmark.create(query);

    return res
        .status(201)
        .json(new ApiResponse(201, bookmark, "Bookmark added successfully"));
});

const removeBookmark = asyncHandler(async (req, res) => {
    const { id } = req.params; // bookmark ID or review ID

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid ID parameter");
    }

    // Attempt to delete by Bookmark ID first, otherwise delete by review matching owner
    let bookmark = await Bookmark.findById(id);
    
    if (!bookmark) {
        // Search by review reference
        bookmark = await Bookmark.findOne({
            owner: req.user._id,
            $or: [
                { cropReview: id },
                { seedReview: id },
                { fertilizerReview: id }
            ]
        });
    }

    if (!bookmark) {
        throw new ApiError(404, "Bookmark not found");
    }

    if (bookmark.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to remove this bookmark");
    }

    await Bookmark.findByIdAndDelete(bookmark._id);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Bookmark removed successfully"));
});

const getUserBookmarks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const aggregateQuery = Bookmark.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(req.user._id) } },
        {
            $lookup: {
                from: "cropreviews",
                localField: "cropReview",
                foreignField: "_id",
                as: "cropReviewDetails"
            }
        },
        {
            $lookup: {
                from: "seedreviews",
                localField: "seedReview",
                foreignField: "_id",
                as: "seedReviewDetails"
            }
        },
        {
            $lookup: {
                from: "fertilizerreviews",
                localField: "fertilizerReview",
                foreignField: "_id",
                as: "fertilizerReviewDetails"
            }
        },
        {
            $addFields: {
                cropReview: { $first: "$cropReviewDetails" },
                seedReview: { $first: "$seedReviewDetails" },
                fertilizerReview: { $first: "$fertilizerReviewDetails" }
            }
        },
        {
            $project: {
                cropReviewDetails: 0,
                seedReviewDetails: 0,
                fertilizerReviewDetails: 0
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const bookmarks = await Bookmark.aggregatePaginate(aggregateQuery, options);

    return res
        .status(200)
        .json(new ApiResponse(200, bookmarks, "User bookmarks fetched successfully"));
});

export {
    addBookmark,
    removeBookmark,
    getUserBookmarks
};
