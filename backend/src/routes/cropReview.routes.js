import { Router } from "express";
import {
    publishCropReview,
    getAllCropReviews,
    getCropReviewById,
    updateCropReview,
    deleteCropReview,
    toggleLike
} from "../controllers/cropReview.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyjwt, { verifyjwtOptional } from "../middlewares/auth.middleware.js";
import cropPeerReviewRouter from "./cropPeerReview.routes.js";

const router = Router();

router.use("/:id/peer-reviews", cropPeerReviewRouter);

router.route("/")
    .post(verifyjwt, upload.array("images", 5), publishCropReview)
    .get(verifyjwtOptional, getAllCropReviews);

router.route("/:id")
    .get(verifyjwtOptional, getCropReviewById)
    .patch(verifyjwt, upload.array("images", 5), updateCropReview)
    .delete(verifyjwt, deleteCropReview);

router.route("/toggle-like/:id").post(verifyjwt, toggleLike);

export default router;
