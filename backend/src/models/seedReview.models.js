import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const seedReviewSchema = new mongoose.Schema({
    seedBrand: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    cropName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    germinationRate: {
        type: String,
        required: true,
        trim: true
    },
    diseaseResistance: {
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
    price: {
        type: Number,
        required: true
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
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

seedReviewSchema.plugin(mongooseAggregatePaginate);

const SeedReview = mongoose.model("SeedReview", seedReviewSchema);
export default SeedReview;
