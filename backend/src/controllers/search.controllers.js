import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import CropReview from "../models/cropReview.models.js";
import SeedReview from "../models/seedReview.models.js";
import FertilizerReview from "../models/fertilizerReview.models.js";

const searchCommunity = asyncHandler(async (req, res) => {
    const { cropName, seedBrand, soilType, season, state, district, rating } = req.query;

    const cropMatch = {};
    const seedMatch = {};
    const fertilizerMatch = {};

    if (rating) {
        const ratingNum = Number(rating);
        cropMatch.rating = ratingNum;
        seedMatch.rating = ratingNum;
        fertilizerMatch.rating = ratingNum;
    }

    // Crop reviews matching criteria
    if (cropName) cropMatch.cropName = { $regex: cropName, $options: "i" };
    if (soilType) cropMatch.soilType = { $regex: soilType, $options: "i" };
    if (season) cropMatch.season = { $regex: season, $options: "i" };
    if (state) cropMatch.state = { $regex: state, $options: "i" };
    if (district) cropMatch.district = { $regex: district, $options: "i" };

    // Seed reviews matching criteria
    if (seedBrand) seedMatch.seedBrand = { $regex: seedBrand, $options: "i" };
    if (cropName) seedMatch.cropName = { $regex: cropName, $options: "i" };

    // Fertilizer reviews matching criteria
    if (cropName) fertilizerMatch.suitableCrop = { $regex: cropName, $options: "i" };
    
    // Fetch matching data concurrently
    const [cropReviews, seedReviews, fertilizerReviews] = await Promise.all([
        CropReview.find(cropMatch).populate("owner", "fullname username avatar").sort({ createdAt: -1 }),
        SeedReview.find(seedMatch).populate("owner", "fullname username avatar").sort({ createdAt: -1 }),
        FertilizerReview.find(fertilizerMatch).populate("owner", "fullname username avatar").sort({ createdAt: -1 })
    ]);

    const results = {
        cropReviews,
        seedReviews,
        fertilizerReviews
    };

    return res
        .status(200)
        .json(new ApiResponse(200, results, "Search results retrieved successfully"));
});

export { searchCommunity };
