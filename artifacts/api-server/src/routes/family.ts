import {
  CreateBankDepositBody,
  CreateBankDepositParams,
  CreateBankDepositResponse,
  CreateContributionBody,
  CreateContributionParams,
  CreateContributionResponse,
  GetFamilyResponse,
  GetOverviewResponse,
  LinkBankAccountBody,
  LinkBankAccountParams,
  LinkBankAccountResponse,
  ListMemberBankAccountsParams,
  ListMemberBankAccountsResponse,
  ListMemberContributionsParams,
  ListMemberContributionsResponse,
  type BankAccount as ApiBankAccount,
  type Bucket as ApiBucket,
  type Contribution as ApiContribution,
} from "@workspace/api-zod";
import type { BankAccount, BankDeposit, Bucket, Member } from "@workspace/db";
import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  contributeToBucket,
  depositToBank,
  getFamilyWithMembers,
  getOverview,
  linkBankAccount,
  listBankAccounts,
  listMemberContributions,
  type ContributionDetail,
} from "../services/family";
import { parseOr400, serviceErrorHandler, toChain } from "./shared";

/**
 * Family, bank and bucket routes. Every route is behind `requireAuth`; the
 * API acts for whichever member the request names.
 */
const router: IRouter = Router();

// ---- Serializers: database rows -> API shapes ------------------------------

function toMember(m: Member) {
  return {
    id: m.id,
    displayName: m.displayName,
    role: m.role,
    relationship: m.relationship,
    age: m.age,
    onboardingComplete: m.onboardingComplete,
    onchainId: m.onchainId,
  };
}

function toBankAccount(a: BankAccount): ApiBankAccount {
  return {
    id: a.id,
    memberId: a.memberId,
    bankName: a.bankName,
    last4: a.last4,
    balanceCents: a.balanceCents,
    chain: toChain(a),
  };
}

function toBucket(b: Bucket): ApiBucket {
  return {
    id: b.id,
    name: b.name,
    perPurchaseLimitCents: b.perPurchaseLimitCents,
    approvalThresholdCents: b.approvalThresholdCents,
    availableCents: b.availableCents,
    heldCents: b.heldCents,
    spentCents: b.spentCents,
    chain: toChain(b),
  };
}

function toDeposit(d: BankDeposit) {
  return {
    id: d.id,
    bankAccountId: d.bankAccountId,
    amountCents: d.amountCents,
    createdAt: d.createdAt,
    chain: toChain(d),
  };
}

function toContribution(d: ContributionDetail): ApiContribution {
  const c = d.contribution;
  return {
    id: c.id,
    memberId: c.funderMemberId,
    bucketId: c.bucketId,
    bucketName: d.bucketName,
    bankAccountId: c.bankAccountId,
    bankName: d.bankName,
    bankLast4: d.bankLast4,
    amountCents: c.amountCents,
    createdAt: c.createdAt,
    chain: toChain(c),
  };
}

// ---- Routes -----------------------------------------------------------------

router.get("/family", requireAuth, async (_req, res) => {
  const { family, members } = await getFamilyWithMembers();
  res.json(
    GetFamilyResponse.parse({
      id: family.id,
      name: family.name,
      members: members.map(toMember),
    }),
  );
});

router.get("/overview", requireAuth, async (_req, res) => {
  const { family, totals, buckets } = await getOverview();
  res.json(
    GetOverviewResponse.parse({
      familyId: family.id,
      totals,
      buckets: buckets.map(toBucket),
    }),
  );
});

router.get(
  "/members/:memberId/bank-accounts",
  requireAuth,
  async (req, res) => {
    const params = parseOr400(ListMemberBankAccountsParams, req.params, res);
    if (!params) return;
    const accounts = await listBankAccounts(params.memberId);
    res.json(ListMemberBankAccountsResponse.parse(accounts.map(toBankAccount)));
  },
);

router.post(
  "/members/:memberId/bank-accounts",
  requireAuth,
  async (req, res) => {
    const params = parseOr400(LinkBankAccountParams, req.params, res);
    if (!params) return;
    const body = parseOr400(LinkBankAccountBody, req.body, res);
    if (!body) return;
    const account = await linkBankAccount({
      memberId: params.memberId,
      bankName: body.bankName,
    });
    res.status(201).json(LinkBankAccountResponse.parse(toBankAccount(account)));
  },
);

router.post(
  "/bank-accounts/:bankAccountId/deposits",
  requireAuth,
  async (req, res) => {
    const params = parseOr400(CreateBankDepositParams, req.params, res);
    if (!params) return;
    const body = parseOr400(CreateBankDepositBody, req.body, res);
    if (!body) return;
    const { deposit, bankAccount } = await depositToBank({
      bankAccountId: params.bankAccountId,
      amountCents: body.amountCents,
    });
    res.status(201).json(
      CreateBankDepositResponse.parse({
        deposit: toDeposit(deposit),
        bankAccount: toBankAccount(bankAccount),
      }),
    );
  },
);

router.post(
  "/buckets/:bucketId/contributions",
  requireAuth,
  async (req, res) => {
    const params = parseOr400(CreateContributionParams, req.params, res);
    if (!params) return;
    const body = parseOr400(CreateContributionBody, req.body, res);
    if (!body) return;
    const { contribution, bankAccount, bucket } = await contributeToBucket({
      bucketId: params.bucketId,
      memberId: body.memberId,
      bankAccountId: body.bankAccountId,
      amountCents: body.amountCents,
    });
    res.status(201).json(
      CreateContributionResponse.parse({
        contribution: toContribution({
          contribution,
          bucketName: bucket.name,
          bankName: bankAccount.bankName,
          bankLast4: bankAccount.last4,
        }),
        bankAccount: toBankAccount(bankAccount),
        bucket: toBucket(bucket),
      }),
    );
  },
);

router.get(
  "/members/:memberId/contributions",
  requireAuth,
  async (req, res) => {
    const params = parseOr400(ListMemberContributionsParams, req.params, res);
    if (!params) return;
    const { totalCents, contributions } = await listMemberContributions(
      params.memberId,
    );
    res.json(
      ListMemberContributionsResponse.parse({
        memberId: params.memberId,
        totalCents,
        contributions: contributions.map(toContribution),
      }),
    );
  },
);

router.use(serviceErrorHandler("Family route"));

export default router;
