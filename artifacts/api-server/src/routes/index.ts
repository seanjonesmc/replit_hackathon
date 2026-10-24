import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";

const router: IRouter = Router();

// Public routes.
router.use(healthRouter);
router.use(authRouter);

// Family routes mount below this line behind `requireAuth`
// (from ../middlewares/requireAuth), which returns 401 JSON when signed out.

export default router;
