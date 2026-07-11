import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Question from "../models/question.models.js";
import Answer from "../models/answer.models.js";
import Like from "../models/like.models.js";

const askQuestion = asyncHandler(async (req, res) => {
    const { title, description, cropCategory } = req.body;

    if (!title || !description || !cropCategory) {
        throw new ApiError(400, "Title, description, and crop category are required");
    }

    const question = await Question.create({
        title,
        description,
        cropCategory,
        owner: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, question, "Question posted successfully"));
});

const getQuestions = asyncHandler(async (req, res) => {
    const { cropCategory, q, page = 1, limit = 10 } = req.query;

    const matchConditions = {};
    if (cropCategory) matchConditions.cropCategory = { $regex: cropCategory, $options: "i" };
    if (q) {
        matchConditions.$or = [
            { title: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } }
        ];
    }

    const questionAggregate = Question.aggregate([
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
                from: "answers",
                localField: "_id",
                foreignField: "question",
                as: "answers"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "question",
                as: "likes"
            }
        },
        {
            $addFields: {
                answersCount: { $size: "$answers" },
                likesCount: { $size: "$likes" }
            }
        },
        {
            $project: {
                "ownerDetails.password": 0,
                "ownerDetails.refreshToken": 0,
                answers: 0,
                likes: 0
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const result = await Question.aggregatePaginate(questionAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Questions retrieved successfully"));
});

const getQuestionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid question ID");
    }

    // Increment view count
    const updatedQuestion = await Question.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true }
    );

    if (!updatedQuestion) {
        throw new ApiError(404, "Question not found");
    }

    const questions = await Question.aggregate([
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
                foreignField: "question",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
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
                likes: 0
            }
        }
    ]);

    // Fetch answers separately with aggregation for formatting
    const answers = await Answer.aggregate([
        { $match: { question: new mongoose.Types.ObjectId(id) } },
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
                foreignField: "answer",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
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
                likes: 0
            }
        },
        { $sort: { createdAt: 1 } }
    ]);

    const responseData = {
        question: questions[0],
        answers
    };

    return res
        .status(200)
        .json(new ApiResponse(200, responseData, "Question details retrieved successfully"));
});

const deleteQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid question ID");
    }

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    if (question.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to delete this question");
    }

    await Question.findByIdAndDelete(id);

    // Delete related answers and likes
    await Answer.deleteMany({ question: id });
    await Like.deleteMany({ question: id });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Question deleted successfully"));
});

const toggleQuestionLike = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid question ID");
    }

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    const existingLike = await Like.findOne({
        question: id,
        likeBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Question unliked successfully"));
    } else {
        await Like.create({
            question: id,
            likeBy: req.user._id
        });
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: true }, "Question liked successfully"));
    }
});

export {
    askQuestion,
    getQuestions,
    getQuestionById,
    deleteQuestion,
    toggleQuestionLike
};
