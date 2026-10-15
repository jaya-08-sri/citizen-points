export type TxType = "Positive" | "Negative" | "Redemption" | "Adjustment";
export type AppealStatus = "None" | "Pending" | "Resolved";

export interface Transaction {
  id: string;
  type: TxType;
  points: number;
  category: string;
  refId: string;
  status: "Verified" | "Pending";
  verifiedBy: string;
  createdAt: string; // ISO date
  reason: string;
  appeal: AppealStatus;
}

export type CaseStatus =
  | "Under Verification"
  | "Approved"
  | "Rejected"
  | "Inconclusive"
  | "More Info Needed";

export interface IssueCase {
  id: string;
  reporter: string;
  category: string;
  description: string;
  location: string;
  incidentAt: string;
  mediaCount: number;
  status: CaseStatus;
  submittedAt: string;
  decisionReason?: string;
}

export interface Reward {
  id: string;
  title: string;
  partner: string;
  cost: number;
  description: string;
}

export interface Activity {
  name: string;
  points: string;
  evidence: string;
}
