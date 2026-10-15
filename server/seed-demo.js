// Usage: npm run seed-demo -- someone@example.com
// Adds sample ledger history to an account, so you can try rewards and appeals.
import { init, closeDb, one, run } from "./db.js";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.log("Usage: npm run seed-demo -- someone@example.com");
  process.exit(1);
}

await init();
const user = await one("SELECT id FROM users WHERE email = $1", [email]);
if (!user) {
  console.log(`No account found for ${email}. Sign up on the website first.`);
  await closeDb();
  process.exit(1);
}
const existing = await one("SELECT COUNT(*)::int AS n FROM ledger WHERE user_id = $1", [user.id]);
if (existing.n > 0) {
  console.log("This account already has ledger entries, so nothing was added.");
  await closeDb();
  process.exit(0);
}

const rows = [
  ["Positive", 50, "Community Service", "ACT-2011", "Verified community cleanup", "2026-07-12"],
  ["Positive", 30, "Environment", "ACT-2035", "Verified tree planting drive", "2026-07-28"],
  ["Positive", 100, "Blood Donation", "ACT-2102", "Blood donation confirmed by partner organisation", "2026-08-21"],
  ["Negative", -30, "Civic Violation", "CASE-10001", "Verified violation after review: roadside waste burning", "2026-08-30"],
  ["Positive", 75, "Volunteering", "ACT-2140", "Volunteering at a school reading drive", "2026-09-18"],
];
for (const [type, points, category, ref, reason, date] of rows) {
  await run(
    "INSERT INTO ledger (user_id, type, points, category, ref_id, verified_by, reason, created_at) VALUES ($1, $2, $3, $4, $5, 'SEED', $6, $7)",
    [user.id, type, points, category, ref, reason, date]
  );
}
await closeDb();
console.log(`Added ${rows.length} sample entries (225 points) to ${email}.`);
