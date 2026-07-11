import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    cropReview: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CropReview"
    },
    seedReview: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SeedReview"
    },
    fertilizerReview: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FertilizerReview"
    }
}, { timestamps: true });

commentSchema.plugin(mongooseAggregatePaginate);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
