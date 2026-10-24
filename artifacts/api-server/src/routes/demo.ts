import { ResetDemoBody, ResetDemoResponse } from "@workspace/api-zod";
import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { resetDemo } from "../services/demo";
import { parseOr400, serviceErrorHandler } from "./shared";

/** Presenter controls for rehearsing the demo script. */
const router: IRouter = Router();

// Parent only (403 for anyone else, or for another account's linked parent).
// Never touches the chain.
router.post("/demo/reset", requireAuth, async (req, res) => {
  const body = parseOr400(ResetDemoBody, req.body, res);
  if (!body) return;
  const result = await resetDemo({ memberId: body.memberId, actingUserId: req.user!.id });
  req.log.info(result, "Demo reset");
  res.json(ResetDemoResponse.parse(result));
});

router.use(serviceErrorHandler("Demo route"));

export default router;
