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
| N/A | `mlbId` | **NEW:** Sourced dynamically via MLB API Matchmaker script to enable live headshots. |

### User & Team Mapping
| Legacy Field (`users`) | Modern Field (`User` / `Team`) | Logic / Transformation |
| :--- | :--- | :--- |
| `email` | `User.email` | **Primary Identity Key**. Trimmed and lowercased for NextAuth. |
| `name` | `User.name` | Display name. |
| `team` | `Team.name` | Creates a unique `Team` entity; User linked via `teamId`. |
| `commish` / `admin` | `User.role` | Maps `true` to `COMMISH` or `ADMIN` Enum; otherwise `OWNER`. |
| `aaa`, `aa`, `a` | `aaaAffiliateName`, etc. | **NEW:** Maps custom FFBL franchise lore (e.g., "Balboa Island Bananas"). |

### Draft Pick Mapping (The 2027/2028 Parsing)
* **Year & Round:** Extracted via Regex from legacy `players.last_name` (e.g., `"2027 Round 2"` -> `2027`, `2`).
* **Original Owner:** Mapped from legacy `players.first_name` using `TEAM_ALIAS_MAP` for rebranded franchises.
* **Current Owner:** Mapped from legacy `users.team` (join table) using `TEAM_ALIAS_MAP`.

---

## ✅ 3. Completed Milestones 

### Phase 1: Data Migration & Hydration
* **Position Seeding:** Modern `Position` table seeded with MLB scoring codes (1=SP, 2=C, 3=1B, etc.) and abbreviations.
* **Player Migration:** 3555 active players successfully migrated and linked to teams/positions.
* **Draft Pick Migration:** 160 valid future draft picks (2027 and 2028) migrated. 
    * *Note on Franchise Rebrands:* A `TEAM_ALIAS_MAP` was utilized to map dead legacy names to active modern teams.
* **Idempotent User & Affiliate Sync:** Mapped legacy users to their modern teams with strict NextAuth identity guards (`.trim().toLowerCase()`). Hydrated custom FFBL minor league affiliate names perfectly into the `Team` model.
* **MLB ID Matchmaker:** Built and executed an automated script querying the MLB StatsAPI to match player names in the DB to official `mlbId` integers, enabling live `img.mlbstatic.com` headshots.

### Phase 2: API & Backend Logic (Single-Player Engine)
* **Prisma Singleton:** Established `lib/prisma.ts` to prevent connection exhaustion during hot-reloads.
* **Identity:** `GET /api/users/me` — Fetches current user profile, team metadata, and full roster.
* **Roster Engine:** `GET /api/rosters/[teamId]` — Deep-nested fetch returning Players, Positions, and Draft Picks.
* **Global Search:** `GET /api/players` — Search by `name`, filter by `level`, or filter by `unowned=true` (Free Agency).
* **Mutations & Logging:** `PATCH /api/players/[playerId]` — Enabled live database updates for promotions/demotions, wrapped in a Prisma `$transaction` that simultaneously creates historical `Transaction` logs.
* **Dynamic Roster Validation (The Bouncer):** The `PATCH` route queries `LeagueSettings` to enforce active limits (e.g., 25-man MLB) and stash limits (IL, NA) dynamically. Commish can toggle `enforceRosterLimits` during the offseason.
* **Trade Engine Prep:** Updated schema to an **Asset-Driven Multi-Team Architecture**. Added `expiresAt` for exploding offers, `isTradeLocked` for roster freezes, `TradeComment` for threaded negotiations, and `aiAnalysis` for caching LLM evaluations.
* **Trade Proposal Route (`POST /api/trades/propose`):**
    * Supports infinite-team blockbusters via an asset-driven array.
    * Safely applies a "Roster Freeze" (`isTradeLocked = true`) to **all** involved Players and Draft Picks for team that proposed the trade.
    * Calculates `expiresAt` timestamps for exploding offers.
    * Implements "Double-Lock" co-manager logic by dynamically mapping `TradeApproval` tickets to individual `User`s instead of teams.
    * `POST /api/trades/approve`: Multi-manager approval logic. Verifies bouncer rules for all involved teams before executing transfers and generating `TransType.TRADE` logs.
    * `POST /api/trades/decline`: Decline logic. Puts the Trade into a CANCELLED state and reverts all assets back to being unlocked.

### Phase 3: Frontend Foundations (App Router UI)
* **Deep-Linked Routing:** Built a nested structure (`/teams/[id]` for Active Roster, `/teams/[id]/minors` for Farm System) to maintain team context (Header/Tabs) across views.
* **Modular Components:** Extracted UI into reusable pieces (`RosterTable`, `RosterRow`, `DraftPicksTable`) to prevent spaghetti code and allow instant global design updates.
* **The "Front Office" View:** Designed a 3-column `FarmSystem` grid that dynamically inherits custom FFBL affiliate names and handles empty states gracefully.
* **Live Assets:** Wired up `RosterRow` to utilize the synced `mlbId` for rendering official high-res MLB player headshots (utilizing `unoptimized` for external API stability).
* **The "War Room" Trade Builder (Frontend):**
    * Built a fully responsive, app-like UI using `dnd-kit` to construct infinite-team blockbuster trades without endless page scrolling.
    * Established a unified `UIAsset` React state to seamlessly handle dragging both Players and Draft Picks between dynamic `TradeDropzone` blocks.
    * Implemented visual `<DragOverlay>` mechanics with illegal-move validation (preventing users from dropping assets into their current owner's block).
    * Engineered dynamic dropdown states to add/remove opposing teams from a complex trade on the fly.

---

## 🛠️ 4. Development Roadmap (The Work Ahead)

### Phase 4: API & Trade Engine Completion
* **War Room API Integration:** Connect the `TradeBuilder.tsx` frontend state to the `POST /api/trades/propose` backend route to successfully save blockbuster trades to the database.
* **The Multi-Team Trade Engine:** * `POST /api/trades/comments`: Logic to post to the `TradeComment` threaded discussion.
* **Historical API (The Quarantine Bridge):** * `GET /api/history/books` & `GET /api/history/posts`: Fetch legacy archives.
    * `GET /api/history/transactions`: A federated query stitching modern 2026+ `Transaction` logs with legacy `LegacyTransaction` records via `legacyId`.

### Phase 5: UI Polish & Next-Gen Features
* **Mobile Drag-and-Drop Alternative:** Add a tap-friendly "Move Menu" to the `DraggableAsset` component to allow mobile users to assign players to trade blocks without physically dragging them across the screen.
* **Manual MLB ID Sync Tool:** Build a Commish-only Server Action UI modal to handle "fuzzy matches" (e.g., "Luis Robert Jr." vs "Luis Robert") directly from the frontend.
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


## 🧠 Unified Player Search & Action Architecture

To maintain a **DRY (Don't Repeat Yourself)** codebase and provide an elite UX, the application utilizes a centralized search logic that handles both local database records and real-time MLB API lookups.

### 🔍 1. The Global Search Trigger
Managers can initiate a search for any player (Active, Prospect, or Retired) from a universal search bar. The system first queries the local `Player` table.

### 🛠️ 2. The "Self-Healing" Hybrid Check
If a local player record is found but lacks an `mlbId`:
* The system triggers a background search against `statsapi.mlb.com/api/v1/people/search`.
* The user confirms the match, and the `mlbId` is permanently saved to the local database.
* This ensures the "338 missing players" from the initial migration are fixed organically through usage.

### 🚦 3. Contextual Action Routing
Once a player is selected and the ID is verified, the UI dynamically renders actions based on the player's `Status` and `teamId`:

| Player Status | Ownership | Primary Action | Resulting Flow |
| :--- | :--- | :--- | :--- |
| **RETIRED** | Any / None | `Induct to Ring of Honor` | Opens tribute modal; triggers career stats snapshot to `mlbRawData`. |
| **ACTIVE** | `null` | `Add to Roster` | Moves player to the manager's team; triggers active stats sync. |
| **ACTIVE** | `otherTeamId` | `Propose Trade` | Opens the Trade Constructor with that player pre-loaded. |
| **ACTIVE** | `currentTeamId` | `Manage Player` | Routing to player detail for promotion/demotion/IL placement. |

### ⚡ 4. The Smart Payload
The backend intelligently determines the data requirement based on the action:
* **Induction:** Fetches **Immutable Career Stats** (Total HRs, Lifetime AVG) and saves a permanent JSON snapshot to `mlbRawData`.
* **Roster Add:** Fetches **Live Season Stats** and sets up a recurring nightly sync for active performance data.


---

## ⚠️ 5. Critical Architecture & Session Notes
* **Asset-Driven Trades:** Trades do not have a single `receivingTeamId`. The web of a trade is defined entirely by `fromTeamId` and `toTeamId` on individual `TradeAsset` records. This supports infinite-team trades.
* **Lazy Evaluation for Expirations:** No chron jobs needed for exploding offers. When the Trade UI loads, instantly flip any `PENDING` trades to `CANCELLED` (and unlock their assets) if `expiresAt < now()`.