// Usage: npm run make-verifier -- someone@example.com
import { init, closeDb, run } from "./db.js";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.log("Usage: npm run make-verifier -- someone@example.com");
  process.exit(1);
}

await init();
const result = await run("UPDATE users SET role = 'verifier' WHERE email = $1", [email]);
await closeDb();

if (result.rowCount === 0) {
  console.log(`No account found for ${email}. Sign up on the website first.`);
  process.exit(1);
}
console.log(`${email} is now a verifier. Sign out and sign in again to see the change.`);
