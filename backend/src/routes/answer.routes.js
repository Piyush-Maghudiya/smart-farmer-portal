import { Router } from "express";
import {
    postAnswer,
    updateAnswer,
    deleteAnswer,
    toggleAnswerLike
} from "../controllers/answer.controllers.js";
import verifyjwt from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/question/:questionId").post(verifyjwt, postAnswer);
router.route("/:id")
    .patch(verifyjwt, updateAnswer)
    .delete(verifyjwt, deleteAnswer);

router.route("/toggle-like/:id").post(verifyjwt, toggleAnswerLike);

export default router;
