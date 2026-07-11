import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import CropReview from "../models/cropReview.models.js";
import SeedReview from "../models/seedReview.models.js";
import FertilizerReview from "../models/fertilizerReview.models.js";
import Like from "../models/like.models.js";
import Bookmark from "../models/bookmark.models.js";
import Question from "../models/question.models.js";
import Answer from "../models/answer.models.js";

const getFarmerDashboard = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1. Personal Statistics (Counts)
    const [
        cropReviewsCount,
        seedReviewsCount,
        fertilizerReviewsCount,
        bookmarksCount,
        questionsCount,
        answersCount
    ] = await Promise.all([
        CropReview.countDocuments({ owner: userId }),
        SeedReview.countDocuments({ owner: userId }),
        FertilizerReview.countDocuments({ owner: userId }),
        Bookmark.countDocuments({ owner: userId }),
        Question.countDocuments({ owner: userId }),
        Answer.countDocuments({ owner: userId })
    ]);

    const totalReviews = cropReviewsCount + seedReviewsCount + fertilizerReviewsCount;

    // 2. Total Likes Received (Aggregation pipeline on CropReview, SeedReview, FertilizerReview, Question, and Answer)
    const userCropReviews = await CropReview.find({ owner: userId }).select("_id");
    const userSeedReviews = await SeedReview.find({ owner: userId }).select("_id");
    const userFertilizerReviews = await FertilizerReview.find({ owner: userId }).select("_id");
    const userQuestions = await Question.find({ owner: userId }).select("_id");
    const userAnswers = await Answer.find({ owner: userId }).select("_id");

    const cropReviewIds = userCropReviews.map(r => r._id);
    const seedReviewIds = userSeedReviews.map(r => r._id);
    const fertilizerReviewIds = userFertilizerReviews.map(r => r._id);
    const questionIds = userQuestions.map(q => q._id);
    const answerIds = userAnswers.map(a => a._id);

    const [
        cropLikes,
        seedLikes,
        fertilizerLikes,
        questionLikes,
        answerLikes
    ] = await Promise.all([
        Like.countDocuments({ cropReview: { $in: cropReviewIds } }),
        Like.countDocuments({ seedReview: { $in: seedReviewIds } }),
        Like.countDocuments({ fertilizerReview: { $in: fertilizerReviewIds } }),
        Like.countDocuments({ question: { $in: questionIds } }),
        Like.countDocuments({ answer: { $in: answerIds } })
    ]);

    const totalLikesReceived = cropLikes + seedLikes + fertilizerLikes + questionLikes + answerLikes;

    // 3. Platform Popular Reviews (Aggregation pipeline sorting reviews by number of likes)
    const popularCropsAggregate = await CropReview.aggregate([
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
            $addFields: {
                likesCount: { $size: "$likes" },
                commentsCount: { $size: "$comments" }
            }
        },
        { $sort: { likesCount: -1, commentsCount: -1 } },
        { $limit: 3 },
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
                "ownerDetails.refreshToken": 0,
                likes: 0,
                comments: 0
            }
        }
    ]);

    // 4. Platform Top Rated Crop Reviews
    const topRatedCrops = await CropReview.find()
        .populate("owner", "fullname username avatar")
        .sort({ rating: -1, createdAt: -1 })
        .limit(3);

    // 5. Platform Latest Entries
    const latestCrops = await CropReview.find()
        .populate("owner", "fullname username avatar")
        .sort({ createdAt: -1 })
        .limit(3);

    const latestSeeds = await SeedReview.find()
        .populate("owner", "fullname username avatar")
        .sort({ createdAt: -1 })
        .limit(3);

    const latestFertilizers = await FertilizerReview.find()
        .populate("owner", "fullname username avatar")
        .sort({ createdAt: -1 })
        .limit(3);

    const stats = {
        personalStats: {
            reviewsCount: {
                crop: cropReviewsCount,
                seed: seedReviewsCount,
                fertilizer: fertilizerReviewsCount,
                total: totalReviews
            },
            totalLikesReceived,
            bookmarksCount,
            questionsAsked: questionsCount,
            answersGiven: answersCount
        },
        popularCropReviews: popularCropsAggregate,
        topRatedCropReviews: topRatedCrops,
        latestReviews: {
            crops: latestCrops,
            seeds: latestSeeds,
            fertilizers: latestFertilizers
        }
    };

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Dashboard statistics fetched successfully"));
});

export { getFarmerDashboard };
