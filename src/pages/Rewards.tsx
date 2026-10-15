import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Reward } from "../types";
import { useStore } from "../store";

export default function Rewards() {
  const { balance, redeem } = useStore();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ rewards: Reward[] }>("/api/rewards")
      .then((r) => setRewards(r.rewards))
      .catch((e: Error) => setError(e.message));
  }, []);

  async function onRedeem(reward: Reward) {
    try {
      await redeem(reward.id);
      setError("");
      setMessage(`Redeemed: ${reward.title}. ${reward.cost} points were added to your ledger as a redemption.`);
    } catch (e) {
      setMessage("");
      setError(e instanceof Error ? e.message : "Could not redeem this reward.");
    }
  }

  return (
    <>
      <h1>Rewards</h1>
      <p className="muted">
        You have <strong>{balance} points</strong>. Reward values and partners shown here are samples.
      </p>
      {message && <p className="notice" role="status">{message} <Link to="/ledger">View ledger</Link></p>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="grid-2">
        {rewards.map((r) => (
          <article key={r.id} className="reward">
            <div className="reward-cost">{r.cost} pts</div>
            <h3>{r.title}</h3>
            <div className="muted small">{r.partner}</div>
            <p>{r.description}</p>
            <button className="btn btn-primary" disabled={balance < r.cost} onClick={() => onRedeem(r)}>
              {balance < r.cost ? `Needs ${r.cost - balance} more points` : "Redeem"}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
