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
  listMemberContributions,
  type ContributionDetail,
} from "./contributions";
export { memberOnchainId, seedDemoFamily, type SeedResult } from "./seed";
