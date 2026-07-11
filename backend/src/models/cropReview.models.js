import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const cropReviewSchema = new mongoose.Schema({
    cropName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    season: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    soilType: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    irrigationMethod: {
        type: String,
        required: true,
        trim: true
    },
    fertilizerUsed: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    images: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],
    expectedYield: {
        type: String,
        trim: true
    },
    actualYield: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    district: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

cropReviewSchema.plugin(mongooseAggregatePaginate);

const CropReview = mongoose.model("CropReview", cropReviewSchema);
export default CropReview;
