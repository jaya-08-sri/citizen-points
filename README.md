# Citizen Points

React + TypeScript (frontend), Node.js + Express (backend), PostgreSQL (database).

## Run it on your laptop
1. Create a free database at neon.com and copy its connection string.
2. In this folder, copy `.env.example` to a new file named `.env` and paste your connection string after `DATABASE_URL=`.
3. Run:
       npm install
       npm run dev:all
4. Open http://localhost:5173 (always use 5173, not 4000).

## What is real
- Sign up, sign in, sign out, sessions in an httpOnly cookie, bcrypt password hashes
- Reports, ledger, rewards and verifier decisions stored in PostgreSQL
- The ledger is append-only: the database refuses edits to points and refuses deletes
- Points are set by the server; a verifier cannot review their own report

## Not built yet
Photo/video upload (the form only counts files), email verification, password reset.

## Helper commands (run from this folder, with .env present)
    npm run make-verifier -- someone@example.com
    npm run seed-demo -- someone@example.com

## Deploying
See the step-by-step guide in the chat. Summary:
- Build command:  npm install --include=dev && npm run build
- Start command:  npm start
- Environment variables: DATABASE_URL, JWT_SECRET, NODE_ENV=production, NODE_VERSION=22
