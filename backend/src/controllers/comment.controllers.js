import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Comment from "../models/comment.models.js";

const addComment = asyncHandler(async (req, res) => {
    const { cropReviewId, seedReviewId, fertilizerReviewId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    const commentData = {
        content: content.trim(),
        owner: req.user._id
    };

    if (cropReviewId) {
        if (!mongoose.Types.ObjectId.isValid(cropReviewId)) throw new ApiError(400, "Invalid crop review ID");
        commentData.cropReview = cropReviewId;
    } else if (seedReviewId) {
        if (!mongoose.Types.ObjectId.isValid(seedReviewId)) throw new ApiError(400, "Invalid seed review ID");
        commentData.seedReview = seedReviewId;
    } else if (fertilizerReviewId) {
        if (!mongoose.Types.ObjectId.isValid(fertilizerReviewId)) throw new ApiError(400, "Invalid fertilizer review ID");
        commentData.fertilizerReview = fertilizerReviewId;
    } else {
        throw new ApiError(400, "Target review ID is required");
    }

    const comment = await Comment.create(commentData);

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const getReviewComments = asyncHandler(async (req, res) => {
    const { cropReviewId, seedReviewId, fertilizerReviewId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const matchConditions = {};
    if (cropReviewId) matchConditions.cropReview = new mongoose.Types.ObjectId(cropReviewId);
    else if (seedReviewId) matchConditions.seedReview = new mongoose.Types.ObjectId(seedReviewId);
    else if (fertilizerReviewId) matchConditions.fertilizerReview = new mongoose.Types.ObjectId(fertilizerReviewId);
    else throw new ApiError(400, "Target review ID is required");

    const commentAggregate = Comment.aggregate([
        { $match: matchConditions },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $project: {
                "ownerDetails.password": 0,
                "ownerDetails.refreshToken": 0
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const comments = await Comment.aggregatePaginate(commentAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    const comment = await Comment.findById(id);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        id,
        { $set: { content: content.trim() } },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(id);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to delete this comment");
    }

    await Comment.findByIdAndDelete(id);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export {
    addComment,
    getReviewComments,
    updateComment,
    deleteComment
};
