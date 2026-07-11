import { Router } from "express";
import {
    createFertilizerReview,
    getAllFertilizerReviews,
    getFertilizerReviewById,
    updateFertilizerReview,
    deleteFertilizerReview,
    toggleFertilizerLike
} from "../controllers/fertilizerReview.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyjwt, { verifyjwtOptional } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyjwt, upload.array("images", 5), createFertilizerReview)
    .get(verifyjwtOptional, getAllFertilizerReviews);

router.route("/:id")
    .get(verifyjwtOptional, getFertilizerReviewById)
    .patch(verifyjwt, upload.array("images", 5), updateFertilizerReview)
    .delete(verifyjwt, deleteFertilizerReview);

router.route("/toggle-like/:id").post(verifyjwt, toggleFertilizerLike);

export default router;
