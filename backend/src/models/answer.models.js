import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const answerSchema = new mongoose.Schema({
    answer: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
    }
}, { timestamps: true });

answerSchema.plugin(mongooseAggregatePaginate);

const Answer = mongoose.model("Answer", answerSchema);
export default Answer;
