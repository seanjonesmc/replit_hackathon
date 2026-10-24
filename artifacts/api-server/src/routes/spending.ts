import {
  CreateSwipeBody,
  CreateSwipeResponse,
  FreezeCardResponse,
  GetCardResponse,
  GetPolicyResponse,
  ListApprovalsResponse,
  ListAuthorizationsQueryParams,
  ListAuthorizationsResponse,
  ListMerchantsResponse,
  UnfreezeCardResponse,
  type Authorization as ApiAuthorization,
  type Card as ApiCard,
  type DecidedBy as ApiDecidedBy,
  type Merchant as ApiMerchant,
} from "@workspace/api-zod";
import type { DecidedBy, Merchant } from "@workspace/db";
import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  getDependentCard,
  listAuthorizations,
  listMerchants,
  listPendingApprovals,
  processSwipe,
  setCardFrozen,
  type AuthorizationDetail,
  type CardDetail,
} from "../services/decisions";
import { getFamilyPolicy } from "../services/policies";
import { parseOr400, serviceErrorHandler, toChain } from "./shared";

/**
 * Spending routes: card swipes through the decision engine, the activity
 * feed, approvals, the card's freeze switch, merchants and the policy. Every
 * route is behind `requireAuth`.
 */
const router: IRouter = Router();

// ---- Serializers: database rows -> API shapes ------------------------------

const DECIDED_BY: Record<DecidedBy, ApiDecidedBy> = {
  rule: "Rule",
  ai_guard: "AI guard",
};

function toAuthorization(d: AuthorizationDetail): ApiAuthorization {
  const a = d.authorization;
  return {
    id: a.id,
    cardId: a.cardId,
    dependentId: a.dependentMemberId,
    merchantId: a.merchantId,
    merchantName: a.merchantName,
    mcc: a.mcc,
    merchantCategory: a.merchantCategory,
    items: a.items,
    amountCents: a.amountCents,
    location: a.location,
    swipedAt: a.swipedAt,
    bucketId: a.bucketId,
    bucketName: d.bucketName,
    decision: a.decision,
    status: a.status,
    reasonCode: a.reasonCode,
    reason: a.reason,
    decidedBy: DECIDED_BY[a.decidedBy],
    aiConfidence: a.aiConfidence,
    decisionMs: a.decisionMs,
    previousAuthorizationId: a.previousAuthorizationId,
    nextAuthorizationId: d.nextAuthorizationId,
    resolvedAt: a.resolvedAt,
    settledAt: a.settledAt,
    createdAt: a.createdAt,
    chain: toChain(a),
    captureChain: toChain({
      chainStatus: a.captureChainStatus,
      chainTxHash: a.captureChainTxHash,
      chainConfirmedAt: a.captureChainConfirmedAt,
    }),
  };
}

function toCard({ card, dependentName }: CardDetail): ApiCard {
  return {
    id: card.id,
    dependentId: card.dependentMemberId,
    dependentName,
    last4: card.last4,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    status: card.status,
    onchainCardId: card.onchainCardId,
    chain: toChain(card),
  };
}

function toMerchant(m: Merchant): ApiMerchant {
  return {
    id: m.id,
    name: m.name,
    mcc: m.mcc,
    category: m.category,
    onchainId: m.onchainId,
    chain: toChain(m),
  };
}

// ---- Routes -----------------------------------------------------------------

router.post("/swipes", requireAuth, async (req, res) => {
  const body = parseOr400(CreateSwipeBody, req.body, res);
  if (!body) return;
  const { authorization: a, bucketName } = await processSwipe(body);
  res.status(201).json(
    CreateSwipeResponse.parse({
      authorizationId: a.id,
      decision: a.decision,
      reasonCode: a.reasonCode,
      reason: a.reason,
      decidedBy: DECIDED_BY[a.decidedBy],
      aiConfidence: a.aiConfidence,
      bucketId: a.bucketId,
      bucketName,
      decisionMs: a.decisionMs,
      chain: toChain(a),
    }),
  );
});

router.get("/merchants", requireAuth, async (_req, res) => {
  const merchants = await listMerchants();
  res.json(ListMerchantsResponse.parse(merchants.map(toMerchant)));
});

router.get("/authorizations", requireAuth, async (req, res) => {
  const query = parseOr400(ListAuthorizationsQueryParams, req.query, res);
  if (!query) return;
  const rows = await listAuthorizations({ limit: query.limit });
  res.json(ListAuthorizationsResponse.parse(rows.map(toAuthorization)));
});

router.get("/approvals", requireAuth, async (_req, res) => {
  const rows = await listPendingApprovals();
  res.json(ListApprovalsResponse.parse(rows.map(toAuthorization)));
});

router.get("/card", requireAuth, async (_req, res) => {
  res.json(GetCardResponse.parse(toCard(await getDependentCard())));
});

router.post("/card/freeze", requireAuth, async (_req, res) => {
  res.json(FreezeCardResponse.parse(toCard(await setCardFrozen(true))));
});

router.post("/card/unfreeze", requireAuth, async (_req, res) => {
  res.json(UnfreezeCardResponse.parse(toCard(await setCardFrozen(false))));
});

router.get("/policy", requireAuth, async (_req, res) => {
  const { familyId, presetName, timeZone, policy } = await getFamilyPolicy();
  res.json(GetPolicyResponse.parse({ familyId, presetName, timeZone, policy }));
});

router.use(serviceErrorHandler("Spending route"));

export default router;
