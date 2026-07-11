import { Router } from "express";
import {
    askQuestion,
    getQuestions,
    getQuestionById,
    deleteQuestion,
    toggleQuestionLike
} from "../controllers/question.controllers.js";
import verifyjwt, { verifyjwtOptional } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyjwt, askQuestion)
    .get(verifyjwtOptional, getQuestions);

router.route("/:id")
    .get(verifyjwtOptional, getQuestionById)
    .delete(verifyjwt, deleteQuestion);

router.route("/toggle-like/:id").post(verifyjwt, toggleQuestionLike);

export default router;
