# 📜 FFBL Rebuild: Master Context File

## ⚾ 1. The Project Manifesto
**Project Title:** FFBL Modernization (2026 Rebuild)  
**Core Stack:** Next.js 15 (App Router), Prisma 7, PostgreSQL, NextAuth.js, Tailwind CSS.  
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

### Phase 2: API & Backend Logic (Part 1)
* **Database Prep:** `schema.prisma` successfully updated with modern `Transaction`, `Trade`, and `TradeAsset` models.
* **Prisma Singleton:** Established `lib/prisma.ts` to prevent connection exhaustion during hot-reloads.
* **Identity:** `GET /api/users/me` — Fetches current user profile, team metadata, and full roster (currently mocked with hardcoded email until Phase 3).
* **Roster Engine:** `GET /api/rosters/[teamId]` — Deep-nested fetch returning Players, Positions, and Draft Picks.
* **Global Search:** `GET /api/players` — Search by `name`, filter by `level`, or filter by `unowned=true` (Free Agency).
* **Mutations:** `PATCH /api/players/[playerId]` — Enabled live database updates for promotions, demotions, and team assignments.

---

## 🛠️ 4. Development Roadmap (The Work Ahead)

### Phase 2: API & Backend Logic (CURRENT)
* **Transaction Logging (API Wiring):** Update the `PATCH /api/players/[playerId]` route to automatically generate a `Transaction` log (e.g., `TransType.PROMOTE`) whenever a player is moved.
* **Roster Validation:** Enforce limits (e.g., max 40 players) within the `PATCH` route middleware.
* **The Trade Engine:** * `POST /api/trades/propose`: Logic to create `Trade` and `TradeAsset` records.
    * `POST /api/trades/approve`: Logic for co-manager "double-lock" approval.
* **Historical API (The Quarantine Bridge):** * `GET /api/history/books`: Fetch legacy book club reviews from the Quarantine tables.
    * `GET /api/history/posts`: Fetch legacy message board posts (`LegacyPost`).
    * `GET /api/history/transactions`: A federated query stitching modern 2026+ `Transaction` records with legacy `LegacyTransaction` records using a player's `legacyId`.

### Phase 3: Frontend Development (Next.js)
* **Auth UI:** Custom Sign-in page with NextAuth.js.
* **The "War Room" (Dashboard):** Real-time view of trade offers, transaction feeds, and roster health.
* **Trade Proposer:** Draggable UI to select players/picks and send offers.

---

## ⚠️ 5. Critical Architecture & Session Notes
* **Next.js 15 Async Params (CRITICAL):** In Next.js 15, `params` and `searchParams` in Route Handlers are **Promises**. You must `await` them before accessing IDs (e.g., `const { teamId } = await params;`), or Prisma will receive `undefined`.
* **Prisma Singleton:** Always import Prisma from `@/lib/prisma` in your routes, never initialize a `new PrismaClient()` directly in a route file.
* **Path Aliasing & Terminal Rules:** Use single quotes when creating dynamic route folders in the terminal (e.g., `mkdir -p 'src/app/api/rosters/[teamId]'`) to bypass shell pattern matching.
* **Schema Updates on Live Tables:** If pushing a new required column to a populated table, always add a temporary default value (e.g., `@default(now())`) to prevent Postgres constraint failures.
* **Database Integrity:** Do **NOT** run `prisma db push --force-reset`. It will permanently destroy the 10-year Quarantine archive.