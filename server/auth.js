import jwt from "jsonwebtoken";
import { one } from "./db.js";

export const IS_PROD = process.env.NODE_ENV === "production";
export const COOKIE = "cp_session";

// In production you MUST set JWT_SECRET to a long random value.
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-before-launch";
if (IS_PROD && !process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Refusing to start in production.");
  process.exit(1);
}

// Lets route functions be async and still send errors to the error handler.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function publicUser(row) {
  return { id: row.id, citizenId: row.citizen_id, name: row.name, email: row.email, role: row.role };
}

export function startSession(res, userId) {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE, token, {
    httpOnly: true, // JavaScript in the page cannot read this cookie
    sameSite: "lax",
    secure: IS_PROD,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function currentUser(req) {
  const token = req.cookies[COOKIE];
  if (!token) return null;
  let sub;
  try {
    sub = jwt.verify(token, JWT_SECRET).sub;
  } catch {
    return null;
  }
  return one("SELECT * FROM users WHERE id = $1", [sub]);
}

// requireAuth() = any signed-in user. requireAuth("verifier") = verifiers only.
export function requireAuth(role) {
  return wrap(async (req, res, next) => {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: "Please sign in." });
    if (role && user.role !== role) return res.status(403).json({ error: "You do not have access to this." });
    req.user = user;
    next();
  });
}
