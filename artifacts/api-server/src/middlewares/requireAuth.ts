import type { ErrorEnvelope } from "@workspace/api-zod";
import type { NextFunction, Request, Response } from "express";

/**
 * Require-sign-in guard for every family route.
 *
 * `authMiddleware` (mounted app-wide) has already loaded the session user onto
 * the request, so this only checks it. Signed-out requests get 401 JSON in the
 * spec's `Unauthorized` response shape; signed-in requests continue with
 * `req.user` set.
 *
 * Mount it on a router or route, e.g. `router.use("/family", requireAuth, familyRouter)`.
 */
export function requireAuth(
  req: Request,
  res: Response<ErrorEnvelope>,
  next: NextFunction,
): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
