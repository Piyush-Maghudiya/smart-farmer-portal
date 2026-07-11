import { Router } from "express";
import {
    addPeerReview,
    getPeerReviews,
    deletePeerReview
} from "../controllers/cropPeerReview.controllers.js";
import verifyjwt, { verifyjwtOptional } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.route("/")
    .post(verifyjwt, addPeerReview)
    .get(verifyjwtOptional, getPeerReviews);

router.route("/:peerReviewId").delete(verifyjwt, deletePeerReview);

export default router;
