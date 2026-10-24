import { and, desc, eq, sql } from "drizzle-orm";
import {
  authorizationsTable,
  bucketsTable,
  db,
  type Authorization,
  type AuthorizationStatus,
  type DbExecutor,
} from "@workspace/db";
import { FamilyServiceError, getDemoFamily } from "../family";

export interface AuthorizationDetail {
  authorization: Authorization;
  bucketName: string | null;
  /** The latest authorization that retried this one, if any. */
  nextAuthorizationId: number | null;
}

/** The latest retry that links back to an authorization (approval chains). */
const nextAuthorizationId = sql<number | null>`(
  SELECT max(retry.id) FROM authorizations retry
  WHERE retry.previous_authorization_id = ${authorizationsTable.id}
)`;

/**
 * The demo family's authorizations, newest first, with bucket names and
 * approval-chain links. Pass a status to filter, e.g. `pending` for approvals.
 */
export async function listAuthorizations(
  options: { limit?: number; status?: AuthorizationStatus; id?: number } = {},
  executor: DbExecutor = db,
): Promise<AuthorizationDetail[]> {
  const family = await getDemoFamily(executor);
  const query = executor
    .select({
      authorization: authorizationsTable,
      bucketName: bucketsTable.name,
      nextAuthorizationId,
    })
    .from(authorizationsTable)
    .leftJoin(bucketsTable, eq(bucketsTable.id, authorizationsTable.bucketId))
    .where(
      and(
        eq(authorizationsTable.familyId, family.id),
        options.status ? eq(authorizationsTable.status, options.status) : undefined,
        options.id !== undefined ? eq(authorizationsTable.id, options.id) : undefined,
      ),
    )
    .orderBy(desc(authorizationsTable.createdAt), desc(authorizationsTable.id));
  return options.limit === undefined ? query : query.limit(options.limit);
}

/** Pending swipes waiting for a parent, newest first. */
export function listPendingApprovals(
  executor: DbExecutor = db,
): Promise<AuthorizationDetail[]> {
  return listAuthorizations({ status: "pending" }, executor);
}

/** One authorization and the latest retry of it, if a parent approved it. */
export interface AuthorizationThread {
  authorization: AuthorizationDetail;
  retry: AuthorizationDetail | null;
}

/**
 * One of the demo family's authorizations with its retry, for a screen
 * waiting on a parent's answer. Throws `not_found` for an unknown id.
 */
export async function getAuthorizationThread(
  id: number,
  executor: DbExecutor = db,
): Promise<AuthorizationThread> {
  const [authorization] = await listAuthorizations({ id }, executor);
  if (!authorization) {
    throw new FamilyServiceError("not_found", `There is no purchase with id ${id}.`);
  }
  const nextId = authorization.nextAuthorizationId;
  const [retry] = nextId === null ? [] : await listAuthorizations({ id: nextId }, executor);
  return { authorization, retry: retry ?? null };
}
