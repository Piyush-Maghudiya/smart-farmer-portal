import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Answer from "../models/answer.models.js";
import Question from "../models/question.models.js";
import Like from "../models/like.models.js";

const postAnswer = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { answer } = req.body;

    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
        throw new ApiError(400, "Invalid or missing question ID");
    }

    if (!answer || answer.trim() === "") {
        throw new ApiError(400, "Answer content cannot be empty");
    }

    const questionExists = await Question.findById(questionId);
    if (!questionExists) {
        throw new ApiError(404, "Question not found");
    }

    const createdAnswer = await Answer.create({
        answer: answer.trim(),
        question: questionId,
        owner: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, createdAnswer, "Answer posted successfully"));
});

const updateAnswer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { answer } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid answer ID");
    }

    if (!answer || answer.trim() === "") {
        throw new ApiError(400, "Answer content is required");
    }

    const existingAnswer = await Answer.findById(id);
    if (!existingAnswer) {
        throw new ApiError(404, "Answer not found");
    }

    if (existingAnswer.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to modify this answer");
    }

    const updatedAnswer = await Answer.findByIdAndUpdate(
        id,
        {
            $set: {
                answer: answer.trim()
            }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedAnswer, "Answer updated successfully"));
});

const deleteAnswer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid answer ID");
    }

    const existingAnswer = await Answer.findById(id);
    if (!existingAnswer) {
        throw new ApiError(404, "Answer not found");
    }

    if (existingAnswer.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You do not have permission to delete this answer");
    }

    await Answer.findByIdAndDelete(id);
    await Like.deleteMany({ answer: id });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Answer deleted successfully"));
});

const toggleAnswerLike = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid answer ID");
    }

    const existingAnswer = await Answer.findById(id);
    if (!existingAnswer) {
        throw new ApiError(404, "Answer not found");
    }

    const existingLike = await Like.findOne({
        answer: id,
        likeBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Answer unliked successfully"));
    } else {
        await Like.create({
            answer: id,
            likeBy: req.user._id
        });
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: true }, "Answer liked successfully"));
    }
});

export {
    postAnswer,
    updateAnswer,
    deleteAnswer,
    toggleAnswerLike
};
