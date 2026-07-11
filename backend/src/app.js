import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors"

const app = express()

// Configure CORS
app.use(cors({
    origin: function (origin, callback) {
        console.log("Incoming CORS request from origin:", origin);
        if (!origin) {
            console.log("No origin header, allowing request");
            return callback(null, true);
        }
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175'
        ];
        const envOrigin = process.env.CORS_ORIGIN?.trim();
        if (envOrigin) {
            allowedOrigins.push(envOrigin);
        }
        console.log("Allowed origins:", allowedOrigins);
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log("Origin allowed");
            callback(null, true);
        } else {
            console.log("Origin rejected by CORS");
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}))

// Standard request body parsing middleware
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Import routes
import userRouter from "./routes/user.routes.js"
import cropReviewRouter from "./routes/cropReview.routes.js"
import seedReviewRouter from "./routes/seedReview.routes.js"
import fertilizerReviewRouter from "./routes/fertilizerReview.routes.js"
import questionRouter from "./routes/question.routes.js"
import answerRouter from "./routes/answer.routes.js"
import commentRouter from "./routes/comment.routes.js"
import bookmarkRouter from "./routes/bookmark.routes.js"
import searchRouter from "./routes/search.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

// Route declarations
app.use("/api/v1/users", userRouter)
app.use("/api/v1/crop-reviews", cropReviewRouter)
app.use("/api/v1/seed-reviews", seedReviewRouter)
app.use("/api/v1/fertilizer-reviews", fertilizerReviewRouter)
app.use("/api/v1/questions", questionRouter)
app.use("/api/v1/answers", answerRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/bookmarks", bookmarkRouter)
app.use("/api/v1/search", searchRouter)
app.use("/api/v1/dashboard", dashboardRouter)

export default app
