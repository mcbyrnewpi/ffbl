Here is the ultimate **"Master Developer Handbook."** I have merged the onboarding instructions of the `README.md` with the deep architectural brain of the `FFBL_CONTEXT.md` into one single, cohesive file.

This is perfect to drop into the root of your project (you can name it `README.md` or `DEVELOPER_HANDBOOK.md`). It gives a new dev exactly what they need to start the app, while preserving all of our architectural rules and AI context at the bottom.

Copy and paste this entire block:

-----

````markdown
# ⚾ FFBL Modernization (2026 Rebuild) - Master Project File

Welcome to the Franklin Fantasy Baseball League (FFBL) modern platform. This project replaces a 10-year-old Ruby on Rails application with a high-performance Next.js 15 application, featuring a "Dual-Era" database that preserves a decade of historical data while powering a modern, asset-driven trade engine and AI-assisted GM tools.

---

## 🚀 1. Getting Started (Local Setup)

### Clone & Install
Clone the repository and install the necessary dependencies:
```bash
git clone [YOUR_REPO_URL]
cd ffbl-rebuild
npm install
````

### Environment Variables

Create a `.env` file in the root of your project. You will need the connection string to our PostgreSQL database. *(Ask the Lead Admin for the current dev credentials).*

```env
# .env
DATABASE_URL="postgresql://user:password@host:5432/franklin_fantasy_legacy"
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000"
```

### Database Sync & Bootstrapping

🚨 **CRITICAL WARNING:** This database contains 10 years of "Quarantine" legacy data (`LegacyPlayer`, `LegacyTransaction`, etc.). **NEVER** run `npx prisma db push --force-reset` or `npx prisma migrate reset`. It will permanently destroy the 2015-2025 historical archive.

Sync your local Prisma client with the database safely:

```bash
npx prisma db push
npx prisma generate
```

Run the bootstrap seed to ensure your local environment has the required structural data (MLB Positions and current League Settings):

```bash
npx prisma db seed
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to view the app. Use `npx prisma studio` to view and manage the database visually.

-----

## 🏗️ 2. Architecture & Tech Stack

**Core Stack:** Next.js 15 (App Router), Prisma 7, PostgreSQL, NextAuth.js, Tailwind CSS, Vercel AI SDK.

**Architecture Strategy: A "Dual-Era" Database**

  * **The Quarantine (Legacy):** 2015–2025 data stored in lowercase tables (e.g., `players`, `users`, `transactions`) using `Int` IDs. This is treated as a strictly read-only historical archive.
  * **The Modern Era (Current):** 2026+ data stored in PascalCase tables (e.g., `Player`, `Team`, `Transaction`) using `String` (CUID) IDs.
  * **Key Technical Rule:** All Modern `Player` records must store their original legacy ID in the `legacyId (Int @unique)` field to permanently maintain the link to the 10-year history.

-----

## 📖 3. The Data Dictionary (Mapping Rules)

### Player Mapping

| Legacy Field (`players`) | Modern Field (`Player`) | Logic / Transformation |
| :--- | :--- | :--- |
| `id` | `legacyId` | Preserved for historical lookup. |
| `first_name` + `last_name` | `firstName`, `lastName` | String trim and custom `toTitleCase` transformation. |
| `dob` | `birthdate` | Standard DateTime transfer. |
| `affiliation` | `level` | Maps "MLB", "AAA", etc., to `Level` Enum. |
| `position_id` | `positions` (Relation) | ID-to-Abbreviation "Rosetta Stone" handshake. **ID 9 is strictly quarantined for Draft Picks.** |

### User, Team, & Draft Pick Mapping

  * **User Identity:** Legacy `email` maps to modern `User.email` (trimmed/lowercased) as the primary NextAuth key.
  * **Roles:** Legacy `commish` / `admin` booleans map to the `User.role` Enum (`COMMISH`, `ADMIN`, `OWNER`).
  * **Draft Picks (2027/2028):** Year & Round extracted via Regex from legacy `players.last_name`. Original/Current Owners mapped using `TEAM_ALIAS_MAP` for rebranded franchises.

-----

## ✅ 4. Completed Milestones

### Phase 1: Data Migration

  * **Position Seeding:** Modern `Position` table seeded with MLB scoring codes.
  * **Legacy Migration:** Migrated 3555 active players, 16 users, and 160 valid future draft picks into the Modern Era tables.

### Phase 2: API & Backend Logic (Single-Player Engine)

  * **Prisma Singleton:** Established `lib/prisma.ts` to prevent connection exhaustion.
  * **Identity & Rosters:** `GET /api/users/me` and `GET /api/rosters/[teamId]` endpoints built for deep-nested data fetching.
  * **Global Search:** `GET /api/players` with name, level, and free agency filters.
  * **Mutations & Logging:** `PATCH /api/players/[playerId]` handles promotions/demotions via Prisma `$transaction`, simultaneously creating historical `TransType` logs.
  * **Dynamic Roster Validation (The Bouncer):** The `PATCH` route dynamically queries `LeagueSettings` to enforce active limits (e.g., 25-man MLB) and stash limits (IL, NA).
  * **Trade Engine Prep:** Updated schema to an **Asset-Driven Multi-Team Architecture**. Added `expiresAt` for exploding offers, `isTradeLocked` for roster freezes, `TradeComment` for threaded negotiations, and `aiAnalysis` for caching LLM evaluations.

-----

## 🛠️ 5. Development Roadmap (The Work Ahead)

### Phase 2: API & Backend Logic (CURRENT)

  * **The Multi-Team Trade Engine:** \* `POST /api/trades/propose`: Asset-driven logic supporting 2-to-N team blockbusters. Creates `PENDING` trade, sets `expiresAt`, and locks assets (`isTradeLocked = true`).
      * `POST /api/trades/approve`: Multi-manager approval logic verifying roster bouncer rules before execution.
      * `POST /api/trades/comments`: Logic for the `TradeComment` threaded discussion.
  * **Historical API (The Quarantine Bridge):** Federated queries stitching modern 2026+ `Transaction` logs with legacy `LegacyTransaction` records via `legacyId`.

### Phase 3: The "Wow" Factor (Next-Gen Features)

  * **The AI GM Assistant (Gemini via Vercel AI SDK):** Trade Evaluator (cached in `aiAnalysis`), Roster Hole Detection, and automated weekly Commish Bot recaps.
  * **Live MLB StatsAPI Integration:** Materialize new draftees and sync with the MLB Pipeline endpoint for "Top 100" badges and ETA dates.
  * **Frictionless Auth & Comms Layer (NextAuth + Resend):** Magic Links for non-Gmail users and transactional emails for trade alerts.
  * **The "War Room" (Dashboard):** Real-time frontend view of trade offers and a draggable trade proposer UI.

-----

## ⚠️ 6. Critical Architecture & Session Notes

  * **Asset-Driven Trades:** Trades do not have a single `receivingTeamId`. The web of a trade is defined entirely by `fromTeamId` and `toTeamId` on individual `TradeAsset` records, supporting infinite-team trades.
  * **Lazy Evaluation for Expirations:** No chron jobs needed for exploding offers. When the Trade UI loads, instantly flip any `PENDING` trades to `CANCELLED` (and unlock their assets) if `expiresAt < now()`.
  * **Next.js 15 Async Params (CRITICAL):** `params` and `searchParams` in Route Handlers are **Promises**. You must `await` them before accessing IDs (e.g., `const { teamId } = await params;`).
  * **Prisma Singleton:** Always import Prisma from `@/lib/prisma` in your routes.
  * **Transactions for Multi-Writes:** Always use `prisma.$transaction(async (tx) => { ... })` when an API route updates a row and creates a log.
  * **Bootstrapping vs. Migrating:** `prisma/seed.ts` is strictly for *structural data* required to boot the app. Legacy migrations belong in `scripts/`.

<!-- end list -->

```

***

There it is! The perfect blend of a welcoming setup guide and a rigorous architectural manifesto. Have a fantastic day, and just say the word when you want to start writing that Trade Proposer route!
```