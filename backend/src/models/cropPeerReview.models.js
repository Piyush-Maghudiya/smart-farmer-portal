import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const cropPeerReviewSchema = new mongoose.Schema({
    cropReview: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CropReview",
        required: true,
        index: true
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

cropPeerReviewSchema.index({ cropReview: 1, reviewer: 1 }, { unique: true });
cropPeerReviewSchema.plugin(mongooseAggregatePaginate);

const CropPeerReview = mongoose.model("CropPeerReview", cropPeerReviewSchema);
export default CropPeerReview;
