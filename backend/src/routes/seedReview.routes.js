import { Router } from "express";
import {
    createSeedReview,
    getAllSeedReviews,
    getSeedReviewById,
    updateSeedReview,
    deleteSeedReview,
    toggleSeedLike
} from "../controllers/seedReview.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyjwt, { verifyjwtOptional } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyjwt, upload.array("images", 5), createSeedReview)
    .get(verifyjwtOptional, getAllSeedReviews);

router.route("/:id")
    .get(verifyjwtOptional, getSeedReviewById)
    .patch(verifyjwt, upload.array("images", 5), updateSeedReview)
    .delete(verifyjwt, deleteSeedReview);

router.route("/toggle-like/:id").post(verifyjwt, toggleSeedLike);

export default router;
