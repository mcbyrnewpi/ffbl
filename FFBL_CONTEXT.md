# 📜 FFBL Rebuild: Master Context File

## ⚾ 1. The Project Manifesto
**Project Title:** FFBL Modernization (2026 Rebuild)  
**Core Stack:** Next.js 15 (App Router), Prisma 7, PostgreSQL, NextAuth.js, Tailwind CSS, Vercel AI SDK.  
**Architecture Strategy:** A "Dual-Era" database.
* **The Quarantine (Legacy):** 2015–2025 data stored in lowercase tables (e.g., `players`, `users`, `transactions`) using `Int` IDs. This is treated as a strictly read-only historical archive.
* **The Modern Era (Current):** 2026+ data stored in PascalCase tables (e.g., `Player`, `Team`, `Transaction`) using `String` (CUID) IDs.

**Key Technical Rule:** All Modern `Player` records must store their original legacy ID in the `legacyId (Int @unique)` field to permanently maintain the link to the 10-year history.

---

## 📖 2. The Data Dictionary (Mapping Rules)

### Player Mapping
| Legacy Field (`players`) | Modern Field (`Player`) | Logic / Transformation |
| :--- | :--- | :--- |
| `id` | `legacyId` | Preserved for historical lookup. |
| `first_name` + `last_name` | `firstName`, `lastName` | String trim and custom `toTitleCase` transformation. |
| `dob` | `birthdate` | Standard DateTime transfer. |
| `affiliation` | `level` | Maps "MLB", "AAA", etc., to `Level` Enum. |
| `position_id` | `positions` (Relation) | ID-to-Abbreviation "Rosetta Stone" handshake (IDs 1-8). **ID 9 is strictly quarantined for Draft Picks.** |

### User & Team Mapping
| Legacy Field (`users`) | Modern Field (`User` / `Team`) | Logic / Transformation |
| :--- | :--- | :--- |
| `email` | `User.email` | **Primary Identity Key**. Trimmed and lowercased for NextAuth. |
| `name` | `User.name` | Display name. |
| `team` | `Team.name` | Creates a unique `Team` entity; User linked via `teamId`. |
| `commish` / `admin` | `User.role` | Maps `true` to `COMMISH` or `ADMIN` Enum; otherwise `OWNER`. |

### Draft Pick Mapping (The 2027/2028 Parsing)
* **Year & Round:** Extracted via Regex from legacy `players.last_name` (e.g., `"2027 Round 2"` -> `2027`, `2`).
* **Original Owner:** Mapped from legacy `players.first_name` using `TEAM_ALIAS_MAP` for rebranded franchises.
* **Current Owner:** Mapped from legacy `users.team` (join table) using `TEAM_ALIAS_MAP`.

---

## ✅ 3. Completed Milestones 

### Phase 1: Data Migration
* **Position Seeding:** Modern `Position` table seeded with MLB scoring codes (1=SP, 2=C, 3=1B, etc.) and abbreviations.
* **Player Migration:** 3555 active players successfully migrated and linked to teams/positions.
* **User & Team Linkage:** 16 legacy users migrated. Modern `User` records created and successfully granted `isPrimaryManager` access.
* **Draft Pick Migration:** 160 valid future draft picks (2027 and 2028) migrated. 
    * *Note on Franchise Rebrands:* A `TEAM_ALIAS_MAP` was utilized to map dead legacy names to active modern teams.

### Phase 2: API & Backend Logic (Single-Player Engine)
* **Prisma Singleton:** Established `lib/prisma.ts` to prevent connection exhaustion during hot-reloads.
* **Identity:** `GET /api/users/me` — Fetches current user profile, team metadata, and full roster.
* **Roster Engine:** `GET /api/rosters/[teamId]` — Deep-nested fetch returning Players, Positions, and Draft Picks.
* **Global Search:** `GET /api/players` — Search by `name`, filter by `level`, or filter by `unowned=true` (Free Agency).
* **Mutations & Logging:** `PATCH /api/players/[playerId]` — Enabled live database updates for promotions/demotions, wrapped in a Prisma `$transaction` that simultaneously creates historical `Transaction` logs.
* **Dynamic Roster Validation (The Bouncer):** The `PATCH` route queries `LeagueSettings` to enforce active limits (e.g., 25-man MLB) and stash limits (IL, NA) dynamically. Commish can toggle `enforceRosterLimits` during the offseason.
* **Bootstrap Architecture:** `prisma/seed.ts` is fully modularized to seed structural app requirements (`Positions` and `LeagueSettings`) using safe `upsert` logic.
* **Trade Engine Prep:** Updated schema to an **Asset-Driven Multi-Team Architecture**. Added `expiresAt` for exploding offers, `isTradeLocked` for roster freezes, `TradeComment` for threaded negotiations, and `aiAnalysis` for caching LLM evaluations.

---

## 🛠️ 4. Development Roadmap (The Work Ahead)

### Phase 2: API & Backend Logic (CURRENT)
* **The Multi-Team Trade Engine:** * `POST /api/trades/propose`: Asset-driven logic that supports 2-to-N team blockbusters. Creates `PENDING` trade, sets `expiresAt`, and locks players/picks (`isTradeLocked = true`).
    * `POST /api/trades/approve`: Multi-manager approval logic. Verifies bouncer rules for all involved teams before executing transfers and generating `TransType.TRADE` logs.
    * `POST /api/trades/comments`: Logic to post to the `TradeComment` threaded discussion.
* **Historical API (The Quarantine Bridge):** * `GET /api/history/books` & `GET /api/history/posts`: Fetch legacy archives.
    * `GET /api/history/transactions`: A federated query stitching modern 2026+ `Transaction` logs with legacy `LegacyTransaction` records via `legacyId`.

### Phase 3: The "Wow" Factor (Next-Gen Features)
* **The AI GM Assistant (Gemini via Vercel AI SDK):**
    * *Trade Evaluator:* Generates scouting reports on pending deals (cached in `aiAnalysis`).
    * *Roster Hole Detection:* Scans the 16-team league to find ideal trade partners based on categorical surpluses/deficits.
    * *Commish Bot:* Automated weekly power rankings written in a custom persona.
    * *Guardrails:* Managed via the `aiCredits` field on the `User` model to prevent API spam.
* **Live MLB StatsAPI Integration:**
    * *Materialization:* Use the API to materialize new draftees into the database with 100% accurate DOBs and mlbIds.
    * *Prospect Intel:* Sync with the undocumented MLB Pipeline endpoint to add "Top 100" badges and ETA dates directly to minor league rosters.
* **Frictionless Auth & Comms Layer (NextAuth + Resend):**
    * *Magic Links:* Allow managers without Gmail to log in seamlessly via email links (utilizing `VerificationToken` and `emailVerified`).
    * *Transactional Emails:* Ping managers automatically when a trade is offered, expiring, or commented on (avoiding expensive SMS setups).
* **The "War Room" (Dashboard):** Real-time frontend view of trade offers, transaction feeds, and a draggable trade proposer UI.

---

## ⚠️ 5. Critical Architecture & Session Notes
* **Asset-Driven Trades:** Trades do not have a single `receivingTeamId`. The web of a trade is defined entirely by `fromTeamId` and `toTeamId` on individual `TradeAsset` records. This supports infinite-team trades.
* **Lazy Evaluation for Expirations:** No chron jobs needed for exploding offers. When the Trade UI loads, instantly flip any `PENDING` trades to `CANCELLED` (and unlock their assets) if `expiresAt < now()`.
* **Next.js 15 Async Params (CRITICAL):** `params` and `searchParams` in Route Handlers are **Promises**. You must `await` them before accessing IDs (e.g