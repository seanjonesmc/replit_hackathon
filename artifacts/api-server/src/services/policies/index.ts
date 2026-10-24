/**
 * Policy service layer: reads the family's stored spending policy in the
 * shared FamilyPolicy shape. Routes and the decision engine import from here.
 */
export {
  getFamilyPolicy,
  toFamilyPolicy,
  type FamilyPolicySettings,
} from "./policy";
