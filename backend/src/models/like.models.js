import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new mongoose.Schema({
    likeBy: {
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
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
    },
    answer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Answer"
    }
}, { timestamps: true });

likeSchema.plugin(mongooseAggregatePaginate);

const Like = mongoose.model("Like", likeSchema);
export default Like;
