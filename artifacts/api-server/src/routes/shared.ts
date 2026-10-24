import type { ChainRecord, ErrorEnvelope } from "@workspace/api-zod";
import type { ErrorRequestHandler, Response } from "express";
import type { z } from "zod";
import { FamilyServiceError } from "../services/family";

/** Helpers shared by the product routers. */

/** A row's chain columns as the API's ChainRecord. */
export function toChain(row: {
  chainStatus: ChainRecord["status"];
  chainTxHash: string | null;
  chainConfirmedAt: Date | null;
}): ChainRecord {
  return {
    status: row.chainStatus,
    txHash: row.chainTxHash,
    confirmedAt: row.chainConfirmedAt,
  };
}

/** Parses input, or sends 400 with the first problem and returns undefined. */
export function parseOr400<S extends z.ZodTypeAny>(
  schema: S,
  value: unknown,
  res: Response<ErrorEnvelope>,
): z.infer<S> | undefined {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
  res
    .status(400)
    .json({ error: `${where}${issue?.message ?? "Invalid request."}` });
  return undefined;
}

const STATUS_BY_KIND: Record<FamilyServiceError["kind"], number> = {
  invalid: 400,
  not_found: 404,
  conflict: 409,
  rule: 422,
};

/**
 * Service errors become their status with the message; anything else is
 * logged and becomes a 500.
 */
export function serviceErrorHandler(label: string): ErrorRequestHandler {
  return (err, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    if (err instanceof FamilyServiceError) {
      res.status(STATUS_BY_KIND[err.kind]).json({ error: err.message });
      return;
    }
    req.log.error({ err }, `${label} failed`);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  };
}
