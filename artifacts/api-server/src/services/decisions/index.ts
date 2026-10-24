/**
 * Decision engine service layer: the rule engine, swipe handling, the card,
 * merchants, the activity feed and the spending seed. Routes and startup
 * import from here, never from the files.
 */
export {
  CATEGORY_BUCKETS,
  evaluateRules,
  SUSPICIOUS_ITEM_KEYWORDS,
  type AiGuardReason,
  type RuleInputs,
  type RuleResult,
} from "./rules";
export {
  processSwipe,
  type AiGuardFn,
  type SwipeInput,
  type SwipeOptions,
  type SwipeOutcome,
} from "./swipes";
export { getDependentCard, setCardFrozen, type CardDetail } from "./cards";
export { listMerchants } from "./merchants";
export {
  getAuthorizationThread,
  listAuthorizations,
  listPendingApprovals,
  type AuthorizationDetail,
  type AuthorizationThread,
} from "./authorizations";
export {
  PASS_MINUTES,
  resolveApproval,
  type ParentDecision,
  type ResolveApprovalInput,
  type ResolveApprovalOutcome,
} from "./approvals";
export {
  mirrorParentDecisionOnChain,
  type ParentDecisionChainOutcome,
} from "./approval-chain";
export {
  DEMO_TIME_ZONE,
  merchantOnchainId,
  seedSpendingDemo,
  type SpendingSeedResult,
} from "./seed";
export {
  getSettlement,
  runSettlement,
  type SettlementDetail,
} from "./settlement";
export { settlementState, settlementSteps, swipeTrace } from "./trace";
