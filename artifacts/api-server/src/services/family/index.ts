/**
 * Family service layer: the demo family, simulated banks, buckets and
 * contributions. Routes and later slices import from here, never the files.
 */
export {
  FamilyServiceError,
  formatCents,
  type FamilyErrorKind,
} from "./errors";
export {
  getDemoFamily,
  getFamilyMember,
  getFamilyWithMembers,
  getOverview,
  type PotTotals,
} from "./family";
export {
  bankLabel,
  depositToBank,
  linkBankAccount,
  listBankAccounts,
} from "./banks";
export {
  contributeToBucket,
  contributionNote,
  defaultContributionNote,
  listMemberContributions,
  sendMoneyToBucket,
  type ContributionDetail,
  type ContributionInput,
  type ContributionOutcome,
} from "./contributions";
export {
  mirrorContributionOnChain,
  mirrorDepositOnChain,
  mirrorSendMoneyOnChain,
} from "./chain-mirror";
export {
  lockDemoSeed,
  memberOnchainId,
  seedDemoFamily,
  type SeedResult,
} from "./seed";
export {
  getActivity,
  getBuckets,
  getCardAndPolicy,
  getDependentWallet,
  getParentOverview,
} from "./read-models";
