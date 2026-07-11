import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const bookmarkSchema = new mongoose.Schema({
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

bookmarkSchema.plugin(mongooseAggregatePaginate);

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
export default Bookmark;
