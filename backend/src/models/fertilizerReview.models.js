import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const fertilizerReviewSchema = new mongoose.Schema({
    fertilizerName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    suitableCrop: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    usageMethod: {
        type: String,
        required: true,
        trim: true
    },
    effectiveness: {
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

fertilizerReviewSchema.plugin(mongooseAggregatePaginate);

const FertilizerReview = mongoose.model("FertilizerReview", fertilizerReviewSchema);
export default FertilizerReview;
