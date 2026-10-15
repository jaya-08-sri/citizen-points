import { Router } from "express";
import { all, one, run, transaction } from "./db.js";
import { requireAuth, wrap } from "./auth.js";

const router = Router();

// The server decides points and rewards. The browser can never set them.
const REPORT_APPROVED_POINTS = 20;

const CATEGORIES = [
  "Illegal dumping", "Damaged road or pothole", "Broken streetlight", "Water leakage",
  "Blocked drain", "Public property damage", "Traffic hazard", "Littering",
  "Noise or pollution", "Other",
];

const REWARDS = [
  { id: "RWD-01", title: "₹50 partner benefit", partner: "Bay Café (sample partner)", cost: 100, description: "Valid on any order above ₹150." },
  { id: "RWD-02", title: "10% discount", partner: "Riverside Books (sample partner)", cost: 250, description: "One-time discount on a single purchase." },
  { id: "RWD-03", title: "₹250 voucher", partner: "Fresh Basket Grocers (sample partner)", cost: 500, description: "Single-use voucher with a one-time redemption code." },
  { id: "RWD-04", title: "Higher-value partner benefit", partner: "City Cycle Works (sample partner)", cost: 1000, description: "Service package or product credit." },
];

const DECISIONS = ["Approved", "Rejected", "Inconclusive", "More Info Needed"];

const caseCode = (id) => `CASE-${10000 + id}`;
const txCode = (id) => `PTX-${String(id).padStart(8, "0")}`;
const fromCaseCode = (code) => {
  const m = /^CASE-(\d+)$/.exec(code);
  const n = m ? Number(m[1]) - 10000 : NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};
const fromTxCode = (code) => {
  const m = /^PTX-(\d+)$/.exec(code);
  const n = m ? Number(m[1]) : NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};
const day = (d) => new Date(d).toISOString().slice(0, 10);

function toCase(r) {
  return {
    id: caseCode(r.id),
    reporter: r.reporter,
    category: r.category,
    description: r.description,
    location: r.location,
    incidentAt: r.incident_at,
    mediaCount: r.media_count,
    status: r.status,
    submittedAt: day(r.created_at),
    decisionReason: r.decision_reason ?? undefined,
  };
}

function toTx(r) {
  return {
    id: txCode(r.id),
    type: r.type,
    points: r.points,
    category: r.category,
    refId: r.ref_id,
    status: r.status,
    verifiedBy: r.verified_by,
    createdAt: day(r.created_at),
    reason: r.reason,
    appeal: r.appeal,
  };
}

const CASE_SELECT = `
  SELECT c.*, u.citizen_id AS reporter
  FROM cases c JOIN users u ON u.id = c.user_id
`;

const BALANCE_SQL =
  "SELECT COALESCE(SUM(points), 0)::int AS b FROM ledger WHERE user_id = $1 AND status = 'Verified'";

/* ---------- Citizen: reports ---------- */

router.get("/reports", requireAuth(), wrap(async (req, res) => {
  const rows = await all(`${CASE_SELECT} WHERE c.user_id = $1 ORDER BY c.id DESC`, [req.user.id]);
  res.json({ reports: rows.map(toCase) });
}));

router.post("/reports", requireAuth(), wrap(async (req, res) => {
  const b = req.body ?? {};
  const category = String(b.category ?? "");
  const description = String(b.description ?? "").trim();
  const location = String(b.location ?? "").trim();
  const incidentAt = String(b.incidentAt ?? "");
  const mediaCount = Number(b.mediaCount);

  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: "Choose a valid category." });
  if (description.length < 20 || description.length > 2000) return res.status(400).json({ error: "Describe the issue in 20 to 2000 characters." });
  if (location.length < 1 || location.length > 200) return res.status(400).json({ error: "Enter where this happened (up to 200 characters)." });
  const when = Date.parse(incidentAt);
  if (Number.isNaN(when) || when > Date.now() + 24 * 60 * 60 * 1000) {
    return res.status(400).json({ error: "Enter a valid date and time that is not in the future." });
  }
  if (!Number.isInteger(mediaCount) || mediaCount < 1 || mediaCount > 20) {
    return res.status(400).json({ error: "Add between 1 and 20 photos or videos." });
  }

  const recent = await one(
    "SELECT COUNT(*)::int AS n FROM cases WHERE user_id = $1 AND created_at >= now() - interval '1 day'",
    [req.user.id]
  );
  if (recent.n >= 10) return res.status(429).json({ error: "You have reached the limit of 10 reports per day." });

  const created = await one(
    "INSERT INTO cases (user_id, category, description, location, incident_at, media_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [req.user.id, category, description, location, incidentAt, mediaCount]
  );
  const row = await one(`${CASE_SELECT} WHERE c.id = $1`, [created.id]);
  res.status(201).json({ report: toCase(row) });
}));

/* ---------- Citizen: ledger and appeals ---------- */

router.get("/ledger", requireAuth(), wrap(async (req, res) => {
  const rows = await all("SELECT * FROM ledger WHERE user_id = $1 ORDER BY id ASC", [req.user.id]);
  const bal = await one(BALANCE_SQL, [req.user.id]);
  res.json({ ledger: rows.map(toTx), balance: bal.b });
}));

router.post("/ledger/:code/appeal", requireAuth(), wrap(async (req, res) => {
  const id = fromTxCode(req.params.code);
  const row = id && (await one("SELECT * FROM ledger WHERE id = $1 AND user_id = $2", [id, req.user.id]));
  if (!row) return res.status(404).json({ error: "Entry not found." });
  if (row.type !== "Negative") return res.status(400).json({ error: "Only reductions can be appealed." });
  if (row.appeal !== "None") return res.status(409).json({ error: "An appeal was already submitted." });
  await run("UPDATE ledger SET appeal = 'Pending' WHERE id = $1", [id]);
  res.json({ ok: true });
}));

/* ---------- Citizen: rewards ---------- */

router.get("/rewards", requireAuth(), (_req, res) => {
  res.json({ rewards: REWARDS });
});

router.post("/rewards/:id/redeem", requireAuth(), wrap(async (req, res) => {
  const reward = REWARDS.find((r) => r.id === req.params.id);
  if (!reward) return res.status(404).json({ error: "Reward not found." });

  const outcome = await transaction(async (client) => {
    // Lock this person's row so two redemptions at once cannot spend the same points.
    await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
    const bal = (await client.query(BALANCE_SQL, [req.user.id])).rows[0].b;
    if (bal < reward.cost) return { short: reward.cost - bal };
    await client.query(
      "INSERT INTO ledger (user_id, type, points, category, ref_id, verified_by, reason) VALUES ($1, 'Redemption', $2, 'Rewards', $3, 'SYSTEM', $4)",
      [req.user.id, -reward.cost, reward.id, `Redeemed: ${reward.title}`]
    );
    return { balance: bal - reward.cost };
  });

  if (outcome.short) return res.status(400).json({ error: `You need ${outcome.short} more points for this reward.` });
  res.json({ balance: outcome.balance });
}));

/* ---------- Verifiers ---------- */

router.get("/admin/cases", requireAuth("verifier"), wrap(async (_req, res) => {
  const rows = await all(`${CASE_SELECT} WHERE c.status = 'Under Verification' ORDER BY c.id ASC`);
  res.json({ cases: rows.map(toCase) });
}));

router.post("/admin/cases/:code/decision", requireAuth("verifier"), wrap(async (req, res) => {
  const id = fromCaseCode(req.params.code);
  const status = String(req.body?.status ?? "");
  const reason = String(req.body?.reason ?? "").trim();

  if (!id) return res.status(404).json({ error: "Case not found." });
  if (!DECISIONS.includes(status)) return res.status(400).json({ error: "Choose a valid decision." });
  if (reason.length < 10 || reason.length > 1000) return res.status(400).json({ error: "Record a reason of 10 to 1000 characters." });

  const outcome = await transaction(async (client) => {
    const c = (await client.query("SELECT * FROM cases WHERE id = $1 FOR UPDATE", [id])).rows[0];
    if (!c) return { code: 404, error: "Case not found." };
    if (c.status !== "Under Verification") return { code: 409, error: "This case has already been decided." };
    if (c.user_id === req.user.id) return { code: 403, error: "You cannot review your own report. Another verifier must do it." };

    await client.query(
      "UPDATE cases SET status = $1, decision_reason = $2, decided_by = $3, decided_at = now() WHERE id = $4",
      [status, reason, req.user.id, id]
    );

    // Only an approved case creates points, and the amount is fixed on the server.
    if (status === "Approved") {
      await client.query(
        "INSERT INTO ledger (user_id, type, points, category, ref_id, verified_by, reason) VALUES ($1, 'Positive', $2, 'Civic Report', $3, $4, 'Verified civic issue report')",
        [c.user_id, REPORT_APPROVED_POINTS, caseCode(id), req.user.citizen_id]
      );
    }
    return { ok: true };
  });

  if (outcome.error) return res.status(outcome.code).json({ error: outcome.error });
  const row = await one(`${CASE_SELECT} WHERE c.id = $1`, [id]);
  res.json({ report: toCase(row) });
}));

export default router;
