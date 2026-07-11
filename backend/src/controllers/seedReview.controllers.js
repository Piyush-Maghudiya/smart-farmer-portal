import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import SeedReview from "../models/seedReview.models.js";
import Like from "../models/like.models.js";
import Comment from "../models/comment.models.js";
import { uploadoncloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const createSeedReview = asyncHandler(async (req, res) => {
    const {
        seedBrand,
        cropName,
        germinationRate,
        diseaseResistance,
        description,
        rating,
        price
    } = req.body;

    if (!seedBrand || !cropName || !germinationRate || !diseaseResistance || !description || !rating || !price) {
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

    const seedReview = await SeedReview.create({
        seedBrand,
        cropName,
        germinationRate,
        diseaseResistance,
        description,
        rating: ratingNum,
        price: priceNum,
        images,
        owner: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, seedReview, "Seed review created successfully"));
});

const getAllSeedReviews = asyncHandler(async (req, res) => {
    const { seedBrand, cropName, rating, page = 1, limit = 10 } = req.query;

    const matchConditions = {};
    if (seedBrand) matchConditions.seedBrand = { $regex: seedBrand, $options: "i" };
    if (cropName) matchConditions.cropName = { $regex: cropName, $options: "i" };
    if (rating) matchConditions.rating = Number(rating);

    const aggregateQuery = SeedReview.aggregate([
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
                foreignField: "seedReview",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "seedReview",
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

    const reviews = await SeedReview.aggregatePaginate(aggregateQuery, options);

    return res
        .status(200)
        .json(new ApiResponse(200, reviews, "Seed reviews fetched successfully"));
});

const getSeedReviewById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid seed review ID");
    }

    const reviews = await SeedReview.aggregate([
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
                foreignField: "seedReview",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "seedReview",
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
        throw new ApiError(404, "Seed review not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, reviews[0], "Seed review details fetched successfully"));
});

const updateSeedReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        seedBrand,
        cropName,
        germinationRate,
        diseaseResistance,
        description,
        rating,
        price
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid seed review ID");
    }

    const review = await SeedReview.findById(id);
    if (!review) {
        throw new ApiError(404, "Seed review not found");
    }

    if (review.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this review");
    }

    const updateData = {};
    if (seedBrand) updateData.seedBrand = seedBrand;
    if (cropName) updateData.cropName = cropName;
    if (germinationRate) updateData.germinationRate = germinationRate;
    if (diseaseResistance) updateData.diseaseResistance = diseaseResistance;
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

    const updatedReview = await SeedReview.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedReview, "Seed review updated successfully"));
});

const deleteSeedReview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid seed review ID");
    }

    const review = await SeedReview.findById(id);
    if (!review) {
        throw new ApiError(404, "Seed review not found");
    }

    if (review.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to delete this review");
    }

    if (review.images && review.images.length > 0) {
        for (const img of review.images) {
            await deleteFromCloudinary(img.public_id);
        }
    }

    await SeedReview.findByIdAndDelete(id);
    await Comment.deleteMany({ seedReview: id });
    await Like.deleteMany({ seedReview: id });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Seed review deleted successfully"));
});

const toggleSeedLike = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid seed review ID");
    }

    const review = await SeedReview.findById(id);
    if (!review) {
        throw new ApiError(404, "Seed review not found");
    }

    const existingLike = await Like.findOne({
        seedReview: id,
        likeBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Seed review unliked successfully"));
    } else {
        await Like.create({
            seedReview: id,
            likeBy: req.user._id
        });
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: true }, "Seed review liked successfully"));
    }
});

export {
    createSeedReview,
    getAllSeedReviews,
    getSeedReviewById,
    updateSeedReview,
    deleteSeedReview,
    toggleSeedLike
};
