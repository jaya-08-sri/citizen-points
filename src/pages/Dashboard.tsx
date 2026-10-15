import { Link } from "react-router-dom";
import { useStore } from "../store";
import { useAuth } from "../auth";
import { fmtDate, signed } from "../utils";

export default function Dashboard() {
  const { ledger, cases, balance } = useStore();
  const { user } = useAuth();

  const contribution = ledger.filter((t) => t.type === "Positive").reduce((s, t) => s + t.points, 0);
  const adjustments = ledger.filter((t) => t.type === "Negative" || t.type === "Adjustment").reduce((s, t) => s + t.points, 0);
  const verifiedContribs = ledger.filter((t) => t.type === "Positive").length;
  const verifiedReports = cases.filter((c) => c.status === "Approved").length;
  const redeemed = ledger.filter((t) => t.type === "Redemption").length;
  const open = cases.filter((c) => c.status === "Under Verification" || c.status === "More Info Needed").length;
  const recent = [...ledger].reverse().slice(0, 5);

  const notifications: string[] = [];
  for (const c of cases) {
    if (c.status === "More Info Needed") notifications.push(`${c.id} needs more information. ${c.decisionReason ?? ""}`);
    else if (c.status === "Under Verification") notifications.push(`${c.id} is waiting for a verifier.`);
  }
  if (notifications.length === 0) notifications.push("No new notifications.");

  return (
    <>
      <h1>Welcome, {user?.name}</h1>
      <p className="muted">{user?.citizenId} · Verification level: Basic</p>

      <section className="score-row">
        <div className="score-seal">
          <div className="score-num">{balance}</div>
          <div className="score-label">points available</div>
        </div>
        <dl className="stats">
          <div><dt>Contribution points</dt><dd>{contribution}</dd></div>
          <div><dt>Verified contributions</dt><dd>{verifiedContribs}</dd></div>
          <div><dt>Verified reports</dt><dd>{verifiedReports}</dd></div>
          <div><dt>Rewards redeemed</dt><dd>{redeemed}</dd></div>
          <div><dt>Open reports</dt><dd>{open}</dd></div>
        </dl>
      </section>

      <div className="two-col">
        <section>
          <div className="section-head">
            <h2>Recent activity</h2>
            <Link to="/ledger">View full ledger</Link>
          </div>
          {recent.length === 0 ? (
            <p className="muted">No activity yet. Points appear here after a verifier approves a report or contribution.</p>
          ) : (
            <ul className="activity-list">
              {recent.map((t) => (
                <li key={t.id}>
                  <div>
                    <strong>{t.reason}</strong>
                    <div className="muted small">{fmtDate(t.createdAt)} · {t.refId}</div>
                  </div>
                  <span className={t.points >= 0 ? "pts pos" : "pts neg"}>{signed(t.points)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>Notifications</h2>
          <ul className="plain-list">
            {notifications.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>

          <h2 className="mt">Verified adjustments</h2>
          <p className="muted small">
            Adjustments follow a reviewed case and are kept apart from your contribution points.
          </p>
          <p><strong>{signed(adjustments)}</strong> points. <Link to="/ledger">Review or appeal</Link></p>
        </section>
      </div>

      <div className="btn-row mt">
        <Link className="btn btn-primary" to="/report">Report an issue</Link>
        <Link className="btn" to="/earn">Find ways to earn points</Link>
        <Link className="btn" to="/rewards">Browse rewards</Link>
      </div>
    </>
  );
}
