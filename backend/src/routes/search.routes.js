import { Router } from "express";
import { searchCommunity } from "../controllers/search.controllers.js";
import { verifyjwtOptional } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(verifyjwtOptional, searchCommunity);

export default router;
