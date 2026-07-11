import { Router } from "express";
import {
    addComment,
    getReviewComments,
    updateComment,
    deleteComment
} from "../controllers/comment.controllers.js";
import verifyjwt, { verifyjwtOptional } from "../middlewares/auth.middleware.js";

const router = Router();

// Add comment to specific reviews
router.route("/crop/:cropReviewId").post(verifyjwt, addComment).get(verifyjwtOptional, getReviewComments);
router.route("/seed/:seedReviewId").post(verifyjwt, addComment).get(verifyjwtOptional, getReviewComments);
router.route("/fertilizer/:fertilizerReviewId").post(verifyjwt, addComment).get(verifyjwtOptional, getReviewComments);

// Update/Delete comment
router.route("/:id")
    .patch(verifyjwt, updateComment)
    .delete(verifyjwt, deleteComment);

export default router;
