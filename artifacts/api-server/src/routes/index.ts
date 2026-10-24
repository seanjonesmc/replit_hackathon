import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import familyRouter from "./family";

const router: IRouter = Router();

// Public routes.
router.use(healthRouter);
router.use(authRouter);

// Family routes. Each one is behind `requireAuth` (../middlewares/requireAuth),
// which returns 401 JSON when signed out.
router.use(familyRouter);

export default router;
