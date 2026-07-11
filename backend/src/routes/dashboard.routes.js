import { Router } from "express";
import { getFarmerDashboard } from "../controllers/dashboard.controllers.js";
import verifyjwt from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(verifyjwt, getFarmerDashboard);

export default router;
