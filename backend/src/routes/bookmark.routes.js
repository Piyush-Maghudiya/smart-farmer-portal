import { Router } from "express";
import {
    addBookmark,
    removeBookmark,
    getUserBookmarks
} from "../controllers/bookmark.controllers.js";
import verifyjwt from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all bookmark routes
router.use(verifyjwt);

router.route("/")
    .post(addBookmark)
    .get(getUserBookmarks);

router.route("/:id").delete(removeBookmark);

export default router;
