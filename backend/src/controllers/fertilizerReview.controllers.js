import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import FertilizerReview from "../models/fertilizerReview.models.js";
import Like from "../models/like.models.js";
import Comment from "../models/comment.models.js";
import { uploadoncloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const createFertilizerReview = asyncHandler(async (req, res) => {
    const {
        fertilizerName,
        suitableCrop,
        usageMethod,
        effectiveness,
        description,
        rating,
        price
    } = req.body;

    if (!fertilizerName || !suitableCrop || !usageMethod || !effectiveness || !description || !rating || !price) {
        throw new ApiError(400, "All fields are required");
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        throw new ApiError(400, "Rating must be a number between 1 and 5");
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
        throw new ApiError(400, "Price must be a valid positive number");
    }

    const files = req.files || [];
    let imagesLocalPaths = [];
    if (Array.isArray(files)) {
        imagesLocalPaths = files.map(f => f.path);
    } else if (files && typeof files === 'object') {
        const fileFields = Object.values(files);
        for (const fieldFiles of fileFields) {
            if (Array.isArray(fieldFiles)) {
                imagesLocalPaths.push(...fieldFiles.map(f => f.path));
            }
        }
    }

    const images = [];
    for (const localPath of imagesLocalPaths) {
        const uploaded = await uploadoncloudinary(localPath);
        if (uploaded) {
            images.push({
                url: uploaded.url,
                public_id: uploaded.public_id
            });
        }
    }

    const fertilizerReview = await FertilizerReview.create({
        fertilizerName,
        suitableCrop,
        usageMethod,
        effectiveness,
        description,
        rating: ratingNum,
        price: priceNum,
        images,
        owner: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, fertilizerReview, "Fertilizer review created successfully"));
});

const getAllFertilizerReviews = asyncHandler(async (req, res) => {
    const { fertilizerName, suitableCrop, rating, page = 1, limit = 10 } = req.query;

    const matchConditions = {};
    if (fertilizerName) matchConditions.fertilizerName = { $regex: fertilizerName, $options: "i" };
    if (suitableCrop) matchConditions.suitableCrop = { $regex: suitableCrop, $options: "i" };
    if (rating) matchConditions.rating = Number(rating);

    const aggregateQuery = FertilizerReview.aggregate([
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
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "fertilizerReview",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "fertilizerReview",
                as: "comments"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                commentsCount: { $size: "$comments" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likeBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "ownerDetails.password": 0,
                "ownerDetails.refreshToken": 0,
                likes: 0,
                comments: 0
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const reviews = await FertilizerReview.aggregatePaginate(aggregateQuery, options);

    return res
        .status(200)
        .json(new ApiResponse(200, reviews, "Fertilizer reviews fetched successfully"));
});

const getFertilizerReviewById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid fertilizer review ID");
    }

    const reviews = await FertilizerReview.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "fertilizerReview",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "fertilizerReview",
                as: "comments"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                commentsCount: { $size: "$comments" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likeBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "ownerDetails.password": 0,
                "ownerDetails.refreshToken": 0,
                likes: 0,
                comments: 0
            }
        }
    ]);

    if (!reviews || reviews.length === 0) {
        throw new ApiError(404, "Fertilizer review not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, reviews[0], "Fertilizer review details fetched successfully"));
});

const updateFertilizerReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        fertilizerName,
        suitableCrop,
        usageMethod,
        effectiveness,
        description,
        rating,
        price
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid fertilizer review ID");
    }

    const review = await FertilizerReview.findById(id);
    if (!review) {
        throw new ApiError(404, "Fertilizer review not found");
    }

    if (review.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this review");
    }

    const updateData = {};
    if (fertilizerName) updateData.fertilizerName = fertilizerName;
    if (suitableCrop) updateData.suitableCrop = suitableCrop;
    if (usageMethod) updateData.usageMethod = usageMethod;
    if (effectiveness) updateData.effectiveness = effectiveness;
    if (description) updateData.description = description;
    if (rating) {
        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            throw new ApiError(400, "Rating must be between 1 and 5");
        }
        updateData.rating = ratingNum;
    }
    if (price) {
        const priceNum = Number(price);
        if (isNaN(priceNum) || priceNum < 0) {
            throw new ApiError(400, "Price must be a positive number");
        }
        updateData.price = priceNum;
    }

    const files = req.files || [];
    let imagesLocalPaths = [];
    if (Array.isArray(files)) {
        imagesLocalPaths = files.map(f => f.path);
    } else if (files && typeof files === 'object') {
        const fileFields = Object.values(files);
        for (const fieldFiles of fileFields) {
            if (Array.isArray(fieldFiles)) {
                imagesLocalPaths.push(...fieldFiles.map(f => f.path));
            }
        }
    }

    if (imagesLocalPaths.length > 0) {
        const newImages = [];
        for (const localPath of imagesLocalPaths) {
            const uploaded = await uploadoncloudinary(localPath);
            if (uploaded) {
                newImages.push({
                    url: uploaded.url,
                    public_id: uploaded.public_id
                });
            }
        }

        if (newImages.length > 0) {
            if (review.images && review.images.length > 0) {
                for (const img of review.images) {
                    await deleteFromCloudinary(img.public_id);
                }
            }
            updateData.images = newImages;
        }
    }

    const updatedReview = await FertilizerReview.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedReview, "Fertilizer review updated successfully"));
});

const deleteFertilizerReview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid fertilizer review ID");
    }

    const review = await FertilizerReview.findById(id);
    if (!review) {
        throw new ApiError(404, "Fertilizer review not found");
    }

    if (review.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to delete this review");
    }

    if (review.images && review.images.length > 0) {
        for (const img of review.images) {
            await deleteFromCloudinary(img.public_id);
        }
    }

    await FertilizerReview.findByIdAndDelete(id);
    await Comment.deleteMany({ fertilizerReview: id });
    await Like.deleteMany({ fertilizerReview: id });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Fertilizer review deleted successfully"));
});

const toggleFertilizerLike = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid fertilizer review ID");
    }

    const review = await FertilizerReview.findById(id);
    if (!review) {
        throw new ApiError(404, "Fertilizer review not found");
    }

    const existingLike = await Like.findOne({
        fertilizerReview: id,
        likeBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Fertilizer review unliked successfully"));
    } else {
        await Like.create({
            fertilizerReview: id,
            likeBy: req.user._id
        });
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: true }, "Fertilizer review liked successfully"));
    }
});

export {
    createFertilizerReview,
    getAllFertilizerReviews,
    getFertilizerReviewById,
    updateFertilizerReview,
    deleteFertilizerReview,
    toggleFertilizerLike
};
