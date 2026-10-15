import { useStore } from "../store";
import { fmtDate, signed } from "../utils";

export default function Ledger() {
  const { ledger, balance, appeal } = useStore();
  const rows = [...ledger].reverse();

  return (
    <>
      <h1>Points ledger</h1>
      <p className="muted">
        Every change to your points is a separate entry. Entries are never edited. Your total is the sum of verified entries: <strong>{balance} points</strong>.
      </p>
      {rows.length === 0 && <p>No entries yet. Points appear here after a verifier approves your contributions.</p>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Date</th>
              <th>Type</th>
              <th className="num">Points</th>
              <th>Category</th>
              <th>Case or activity</th>
              <th>Reason</th>
              <th>Verified by</th>
              <th>Appeal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{fmtDate(t.createdAt)}</td>
                <td>{t.type}</td>
                <td className={`num ${t.points >= 0 ? "pos" : "neg"}`}>{signed(t.points)}</td>
                <td>{t.category}</td>
                <td>{t.refId}</td>
                <td>{t.reason}</td>
                <td>{t.verifiedBy}</td>
                <td>
                  {t.type === "Negative" && t.appeal === "None" ? (
                    <button className="btn btn-small" onClick={() => appeal(t.id)}>Appeal</button>
                  ) : t.type === "Negative" ? (
                    t.appeal
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
