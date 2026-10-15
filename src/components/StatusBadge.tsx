import { CaseStatus } from "../types";

const tone: Record<CaseStatus, string> = {
  "Under Verification": "badge-amber",
  Approved: "badge-teal",
  Rejected: "badge-brick",
  Inconclusive: "badge-slate",
  "More Info Needed": "badge-blue",
};

export default function StatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`badge ${tone[status]}`}>{status}</span>;
}
