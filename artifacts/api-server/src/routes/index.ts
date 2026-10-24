import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import familyRouter from "./family";
import spendingRouter from "./spending";
import demoRouter from "./demo";

const router: IRouter = Router();

// Public routes.
router.use(healthRouter);
router.use(authRouter);

// Product routes. Each one is behind `requireAuth` (../middlewares/requireAuth),
// which returns 401 JSON when signed out.
router.use(familyRouter);
router.use(spendingRouter);
router.use(demoRouter);

export default router;
