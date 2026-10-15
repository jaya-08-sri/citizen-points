import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { init, one, run } from "./db.js";
import { COOKIE, IS_PROD, currentUser, publicUser, startSession, wrap } from "./auth.js";
import router from "./routes.js";

const PORT = process.env.PORT || 4000;
const here = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // we run behind the host's proxy, so req.ip is the real visitor
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

// Simple brake on repeated wrong passwords (per IP, in memory).
const failures = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
function blocked(ip) {
  const e = failures.get(ip);
  return !!e && Date.now() < e.reset && e.count >= MAX_FAILURES;
}
function noteFailure(ip) {
  const e = failures.get(ip);
  if (!e || Date.now() > e.reset) failures.set(ip, { count: 1, reset: Date.now() + WINDOW_MS });
  else e.count += 1;
}

const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

app.post("/api/auth/signup", wrap(async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: "Enter your name (2 to 80 characters)." });
  if (!emailOk(email) || email.length > 254) return res.status(400).json({ error: "Enter a valid email address." });
  if (password.length < 8 || password.length > 72) return res.status(400).json({ error: "Use a password of 8 to 72 characters." });

  if (await one("SELECT id FROM users WHERE email = $1", [email])) {
    return res.status(409).json({ error: "An account with this email already exists. Try signing in." });
  }

  const hash = bcrypt.hashSync(password, 10);
  let id;
  try {
    const created = await one("INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id", [name, email, hash]);
    id = created.id;
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "An account with this email already exists. Try signing in." });
    throw err;
  }
  const user = await one("UPDATE users SET citizen_id = $1 WHERE id = $2 RETURNING *", [`CIT-${100000 + id}`, id]);

  startSession(res, id);
  res.status(201).json({ user: publicUser(user) });
}));

app.post("/api/auth/login", wrap(async (req, res) => {
  if (blocked(req.ip)) {
    return res.status(429).json({ error: "Too many failed attempts. Please wait 15 minutes and try again." });
  }
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const row = await one("SELECT * FROM users WHERE email = $1", [email]);

  // Compare even when the user is missing so response time does not reveal who has an account.
  const ok = bcrypt.compareSync(password, row ? row.password_hash : DUMMY_HASH);
  if (!row || !ok) {
    noteFailure(req.ip);
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  startSession(res, row.id);
  res.json({ user: publicUser(row) });
}));

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

app.get("/api/auth/me", wrap(async (req, res) => {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ error: "Not signed in." });
  res.json({ user: publicUser(user) });
}));

app.get("/api/health", wrap(async (_req, res) => {
  await run("SELECT 1");
  res.json({ ok: true });
}));

// Reports, ledger, rewards and verifier routes
app.use("/api", router);

// In production the same server also serves the built website.
const dist = path.join(here, "..", "dist");
if (IS_PROD && fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

init()
  .then(() => {
    app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Could not connect to the database. Check DATABASE_URL.\n", err.message);
    process.exit(1);
  });
