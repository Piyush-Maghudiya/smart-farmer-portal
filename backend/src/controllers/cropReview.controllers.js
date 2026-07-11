import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import CropReview from "../models/cropReview.models.js";
import Like from "../models/like.models.js";
import Comment from "../models/comment.models.js";
import CropPeerReview from "../models/cropPeerReview.models.js";
import { uploadoncloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const publishCropReview = asyncHandler(async (req, res) => {
    const {
        cropName,
        season,
        soilType,
        irrigationMethod,
        fertilizerUsed,
        description,
        rating,
        expectedYield,
        actualYield,
        state,
        district
    } = req.body;

    if (
        !cropName ||
        !season ||
        !soilType ||
        !irrigationMethod ||
        !fertilizerUsed ||
        !description ||
        !rating ||
        !state ||
        !district
    ) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        throw new ApiError(400, "Rating must be a number between 1 and 5");
    }

    // Handle multiple uploaded images (Multer stores them in req.files)
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

    if (images.length === 0) {
        throw new ApiError(400, "At least one crop photo is required");
    }

    const cropReview = await CropReview.create({
        cropName,
        season,
        soilType,
        irrigationMethod,
        fertilizerUsed,
        description,
        rating: ratingNum,
        images,
        expectedYield,
        actualYield,
        state,
        district,
        owner: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, cropReview, "Crop review published successfully"));
});

const getAllCropReviews = asyncHandler(async (req, res) => {
    const { cropName, season, soilType, state, district, rating, page = 1, limit = 10 } = req.query;

    const matchConditions = {};

    if (cropName) matchConditions.cropName = { $regex: cropName, $options: "i" };
    if (season) matchConditions.season = { $regex: season, $options: "i" };
    if (soilType) matchConditions.soilType = { $regex: soilType, $options: "i" };
    if (state) matchConditions.state = { $regex: state, $options: "i" };
    if (district) matchConditions.district = { $regex: district, $options: "i" };
    if (rating) matchConditions.rating = Number(rating);

    const cropReviewAggregate = CropReview.aggregate([
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
                foreignField: "cropReview",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "cropReview",
                as: "comments"
            }
        },
        {
            $lookup: {
                from: "croppeerreviews",
                localField: "_id",
                foreignField: "cropReview",
                as: "peerReviews"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                commentsCount: { $size: "$comments" },
                peerReviewsCount: { $size: "$peerReviews" },
                avgPeerRating: {
                    $cond: {
                        if: { $gt: [{ $size: "$peerReviews" }, 0] },
                        then: { $avg: "$peerReviews.rating" },
                        else: 0
                    }
                },
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
                comments: 0,
                peerReviews: 0
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const reviews = await CropReview.aggregatePaginate(cropReviewAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, reviews, "Crop reviews fetched successfully"));
});

const getCropReviewById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid crop review ID");
    }

    const reviews = await CropReview.aggregate([
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
                foreignField: "cropReview",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "cropReview",
                as: "comments"
            }
        },
        {
            $lookup: {
                from: "croppeerreviews",
                localField: "_id",
                foreignField: "cropReview",
                as: "peerReviews"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                commentsCount: { $size: "$comments" },
                peerReviewsCount: { $size: "$peerReviews" },
                avgPeerRating: {
                    $cond: {
                        if: { $gt: [{ $size: "$peerReviews" }, 0] },
                        then: { $avg: "$peerReviews.rating" },
                        else: 0
                    }
                },
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
                comments: 0,
                peerReviews: 0
            }
        }
    ]);

    if (!reviews || reviews.length === 0) {
        throw new ApiError(404, "Crop review not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, reviews[0], "Crop review details fetched successfully"));
});

const updateCropReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        cropName,
        season,
        soilType,
        irrigationMethod,
        fertilizerUsed,
        description,
        rating,
        expectedYield,
        actualYield,
        state,
        district
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid crop review ID");
    }

    const review = await CropReview.findById(id);
    if (!review) {
        throw new ApiError(404, "Crop review not found");
    }

    if (review.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this review");
    }

    const updateData = {};
    if (cropName) updateData.cropName = cropName;
    if (season) updateData.season = season;
    if (soilType) updateData.soilType = soilType;
    if (irrigationMethod) updateData.irrigationMethod = irrigationMethod;
    if (fertilizerUsed) updateData.fertilizerUsed = fertilizerUsed;
    if (description) updateData.description = description;
    if (rating) {
        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            throw new ApiError(400, "Rating must be between 1 and 5");
        }
        updateData.rating = ratingNum;
    }
    if (expectedYield !== undefined) updateData.expectedYield = expectedYield;
    if (actualYield !== undefined) updateData.actualYield = actualYield;
    if (state) updateData.state = state;
    if (district) updateData.district = district;

    // Handle new images if uploaded
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

    const updatedReview = await CropReview.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedReview, "Crop review updated successfully"));
});

const deleteCropReview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid crop review ID");
    }

    const review = await CropReview.findById(id);
    if (!review) {
        throw new ApiError(404, "Crop review not found");
    }

    if (review.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to delete this review");
    }

    // Delete images from Cloudinary
    if (review.images && review.images.length > 0) {
        for (const img of review.images) {
            await deleteFromCloudinary(img.public_id);
        }
    }

    await CropReview.findByIdAndDelete(id);

    // Delete comments and likes associated with this review
    await Comment.deleteMany({ cropReview: id });
    await Like.deleteMany({ cropReview: id });
    await CropPeerReview.deleteMany({ cropReview: id });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Crop review deleted successfully"));
});

const toggleLike = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid review ID");
    }

    const review = await CropReview.findById(id);
    if (!review) {
        throw new ApiError(404, "Crop review not found");
    }

    const existingLike = await Like.findOne({
        cropReview: id,
        likeBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Crop review unliked successfully"));
    } else {
        await Like.create({
            cropReview: id,
            likeBy: req.user._id
        });
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: true }, "Crop review liked successfully"));
    }
});

export {
    publishCropReview,
    getAllCropReviews,
    getCropReviewById,
    updateCropReview,
    deleteCropReview,
    toggleLike
};
