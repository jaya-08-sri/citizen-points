import { Link, useLocation } from "react-router-dom";
import { useStore } from "../store";
import StatusBadge from "../components/StatusBadge";
import { fmtDate } from "../utils";

export default function MyReports() {
  const { cases } = useStore();
  const location = useLocation();
  const created = (location.state as { created?: string } | null)?.created;
  const mine = cases;

  return (
    <>
      <div className="section-head">
        <h1>My reports</h1>
        <Link className="btn btn-primary" to="/report">Report an issue</Link>
      </div>

      {created && (
        <p className="notice" role="status">
          {created} was submitted and is now under verification.
        </p>
      )}

      {mine.length === 0 ? (
        <p>You have not submitted any reports yet. Report an issue to open your first case.</p>
      ) : (
        <ul className="case-list">
          {mine.map((c) => (
            <li key={c.id}>
              <div className="case-top">
                <div>
                  <strong>{c.id}</strong> · {c.category}
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p>{c.description}</p>
              <div className="muted small">
                {c.location} · submitted {fmtDate(c.submittedAt)} · {c.mediaCount} file{c.mediaCount === 1 ? "" : "s"}
              </div>
              {c.decisionReason && <p className="reason"><strong>Reviewer note:</strong> {c.decisionReason}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
