import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set.\n" +
      "Create a file named .env in the project folder containing:\n" +
      "DATABASE_URL=your-neon-connection-string"
  );
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 20000, // a sleeping free database needs a few seconds to wake up
});

// A dropped idle connection must not crash the server.
pool.on("error", (err) => console.error("Database connection problem:", err.message));

export async function one(text, params = []) {
  const r = await pool.query(text, params);
  return r.rows[0] ?? null;
}

export async function all(text, params = []) {
  const r = await pool.query(text, params);
  return r.rows;
}

export async function run(text, params = []) {
  return pool.query(text, params);
}

// Runs fn(client) as one all-or-nothing unit. Use client.query inside fn.
export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function closeDb() {
  await pool.end();
}

// Creates the tables the first time the server starts.
export async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      citizen_id    TEXT UNIQUE,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'citizen',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cases (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      category        TEXT NOT NULL,
      description     TEXT NOT NULL,
      location        TEXT NOT NULL,
      incident_at     TEXT NOT NULL,
      media_count     INTEGER NOT NULL,
      status          TEXT NOT NULL DEFAULT 'Under Verification',
      decision_reason TEXT,
      decided_by      INTEGER REFERENCES users(id),
      decided_at      TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      type        TEXT NOT NULL,
      points      INTEGER NOT NULL,
      category    TEXT NOT NULL,
      ref_id      TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'Verified',
      verified_by TEXT NOT NULL,
      reason      TEXT NOT NULL,
      appeal      TEXT NOT NULL DEFAULT 'None',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- The ledger is append-only: rows can be added, never deleted, and the
    -- points and reason of a row can never be changed. Only "appeal" may change.
    CREATE OR REPLACE FUNCTION ledger_guard() RETURNS trigger AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'The ledger is append-only.';
      END IF;
      IF NEW.user_id     IS DISTINCT FROM OLD.user_id
      OR NEW.type        IS DISTINCT FROM OLD.type
      OR NEW.points      IS DISTINCT FROM OLD.points
      OR NEW.category    IS DISTINCT FROM OLD.category
      OR NEW.ref_id      IS DISTINCT FROM OLD.ref_id
      OR NEW.status      IS DISTINCT FROM OLD.status
      OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
      OR NEW.reason      IS DISTINCT FROM OLD.reason
      OR NEW.created_at  IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'The ledger is append-only.';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS ledger_guard_trg ON ledger;
    CREATE TRIGGER ledger_guard_trg
      BEFORE UPDATE OR DELETE ON ledger
      FOR EACH ROW EXECUTE FUNCTION ledger_guard();
  `);
}
