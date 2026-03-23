# 📜 FFBL Rebuild: Master Context File

## ⚾ 1. The Project Manifesto
**Project Title:** FFBL Modernization (2026 Rebuild)  
**Core Stack:** Next.js (App Router), Prisma 7, PostgreSQL, NextAuth.js, Tailwind CSS.  
**Architecture Strategy:** A "Dual-Era" database.
* **The Quarantine (Legacy):** 2015–2025 data stored in lowercase tables (e.g., `players`, `users`) using `Int` IDs. This is treated as a strictly read-only historical archive.
* **The Modern Era (Current):** 2026+ data stored in PascalCase tables (e.g., `Player`, `Team`) using `String` (CUID) IDs.

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

## ✅ 3. Completed Milestones (Phase 1: Data Migration)
*Phase 1 was successfully completed in March 2026. The database is primed.*
* **Position Seeding:** Modern `Position` table seeded with MLB scoring codes (1=SP, 2=C, 3=1B, etc.) and abbreviations (C, 1B, etc.).
* **Player Migration:** 3555 active players successfully migrated and linked to teams/positions.
* **User & Team Linkage:** 16 legacy users migrated. Modern `User` records created and successfully granted `isPrimaryManager` access to their respective `Team` records.
* **Draft Pick Migration:** 160 valid future draft picks (2027 and 2028) migrated. Preserved complex trade histories by mapping `originalOwnerId` vs `currentOwnerId`.
    * *Note on Data Cleansing:* 436 legacy records were isolated as "Draft Picks" (position_id 9). 120 of these were pre-2027 noise and intentionally purged. 156 were malformed/unmappable noise and ignored. 
    * *Note on Franchise Rebrands:* A `TEAM_ALIAS_MAP` was utilized to map dead legacy names (e.g., "Scranton Yankees") to active modern teams (e.g., "Little Town Blues").

---

## 🛠️ 4. Development Roadmap (The Work Ahead)

### Phase 2: API & Backend Logic (CURRENT PHASE)
* **The Trade Engine:** * `POST /api/trades/propose`: Logic to create `Trade` and `TradeAsset` records (handling both Players and Draft Picks).
    * `POST /api/trades/approve`: Logic for co-manager "double-lock" approval.
* **Roster Management:**
    * `GET /api/rosters/[teamId]`: Fetch full roster with health status, levels, and positions.
    * `PATCH /api/players/move`: Move players between levels (MLB ↔ AAA) with validation limits.
* **Historical API:** * `GET /api/history/books`: Fetch legacy book club reviews from the Quarantine tables.
    * `GET /api/history/stats`: Aggregated query crossing Legacy and Modern tables.

### Phase 3: Frontend Development (Next.js)
* **Auth UI:** Custom Sign-in page with NextAuth.js (Google/Discord integration matching on `email`).
* **The "War Room" (Dashboard):** Real-time view of trade offers, transaction feeds, and roster health.
* **League Standings:** Modern view with "Snapshot" data from past seasons.
* **Trade Proposer:** Draggable UI to select players/picks and send offers.

---

## ⚠️ 5. Critical Architecture & Session Notes
* **Adapter Requirement:** Always initialize Prisma with: `new PrismaPg(pool as any)`. Edge functions or Next.js server components must strictly manage DB connections.
* **Schema Updates on Live Tables:** If pushing a new required column (like `updatedAt`) to a table that already has rows, always add a default value temporarily (e.g., `@default(now()) @updatedAt`) to prevent Postgres constraint failures during `prisma db push`.
* **Prisma Client Syncing:** If you add a new schema field (like `legacyId`) and a script throws an `Unknown argument` error, run `npx prisma generate` to sync the TypeScript client.
* **Future Seasons:** 2026, 2027, and 2028 `Season` records have been generated to satisfy Draft Pick relational constraints. Award fields contain `"TBD"`.
* **Database Integrity:** Do **NOT** run `prisma db push --force-reset`. It will permanently destroy the 10-year Quarantine archive. If Prisma reports drift, use the `migrate reset` and `psql` restore workflow (using `SET session_replication_role = 'replica';`).