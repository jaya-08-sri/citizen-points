import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import StatusBadge from "../components/StatusBadge";
import { CaseStatus, IssueCase } from "../types";
import { fmtDate } from "../utils";

export default function Admin() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<IssueCase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<{ cases: IssueCase[] }>("/api/admin/cases");
      setQueue(r.cases);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the queue.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = queue.find((c) => c.id === selectedId);
  const isOwn = !!selected && selected.reporter === user?.citizenId;

  async function choose(status: CaseStatus) {
    if (!selected) return;
    if (reason.trim().length < 10) return setError("Record a reason of at least 10 characters. Every decision needs one.");
    setBusy(true);
    try {
      await api(`/api/admin/cases/${selected.id}/decision`, { method: "POST", body: { status, reason: reason.trim() } });
      setReason("");
      setError("");
      setSelectedId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the decision.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Verification queue</h1>
      <p className="muted">
        Only verifiers can open this page, and the server checks it on every action. You cannot review your own reports.
      </p>
      <div className="two-col admin">
        <section>
          <h2>Waiting for review ({queue.length})</h2>
          {queue.length === 0 && <p>The queue is empty.</p>}
          <ul className="case-list">
            {queue.map((c) => (
              <li key={c.id} className={c.id === selectedId ? "selected" : ""}>
                <button className="case-btn" onClick={() => { setSelectedId(c.id); setError(""); }}>
                  <div className="case-top">
                    <strong>{c.id}</strong>
                    <StatusBadge status={c.status} />
                  </div>
                  <div>{c.category} · {c.location}</div>
                  <div className="muted small">Submitted {fmtDate(c.submittedAt)}</div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Case review</h2>
          {!selected ? (
            <p className="muted">Select a case from the queue to review it.</p>
          ) : (
            <div className="form">
              <dl className="review">
                <div><dt>Case</dt><dd>{selected.id}</dd></div>
                <div><dt>Reporter</dt><dd>{selected.reporter}</dd></div>
                <div><dt>Category</dt><dd>{selected.category}</dd></div>
                <div><dt>Description</dt><dd>{selected.description}</dd></div>
                <div><dt>Location</dt><dd>{selected.location}</dd></div>
                <div><dt>Occurred</dt><dd>{selected.incidentAt.replace("T", " ")}</dd></div>
                <div><dt>Evidence files</dt><dd>{selected.mediaCount} (file upload is not built yet)</dd></div>
              </dl>
              {isOwn && <p className="notice">This is your own report. Another verifier must review it.</p>}
              <label>
                Reason for your decision
                <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} disabled={isOwn} />
              </label>
              {error && <p className="error" role="alert">{error}</p>}
              <div className="btn-row">
                <button className="btn btn-primary" disabled={busy || isOwn} onClick={() => choose("Approved")}>Approve</button>
                <button className="btn" disabled={busy || isOwn} onClick={() => choose("More Info Needed")}>Request more information</button>
                <button className="btn" disabled={busy || isOwn} onClick={() => choose("Inconclusive")}>Close as inconclusive</button>
                <button className="btn btn-danger" disabled={busy || isOwn} onClick={() => choose("Rejected")}>Reject</button>
              </div>
            </div>
          )}
          {!selected && error && <p className="error" role="alert">{error}</p>}
        </section>
      </div>
    </>
  );
}
