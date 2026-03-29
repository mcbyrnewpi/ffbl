# 📜 FFBL Rebuild: Master Context File

## ⚾ 1. The Project Manifesto
**Project Title:** FFBL Modernization (2026 Rebuild)  
**Core Stack:** Next.js 15 (App Router), Prisma 7, PostgreSQL, NextAuth.js, Tailwind CSS, Vercel AI SDK, React Flow (@xyflow/react).  
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
| `position_id` | `positions` (Relation) | ID-to-Abbreviation "Rosetta Stone" handshake. **ID 9 is strictly quarantined for Draft Picks.** |
| N/A | `mlbId` | Sourced dynamically via MLB API Matchmaker script. |
| N/A | `mlbRawData` | Full JSON profile synced from MLB Stats API. |

### User, Team, & Draft Pick Mapping
* **User Identity:** Legacy `email` maps to modern `User.email` (trimmed/lowercased) as the primary NextAuth key.
* **Roles:** Legacy `commish` / `admin` booleans map to the `User.role` Enum (`COMMISH`, `ADMIN`, `OWNER`).
* **Team Lore:** Custom minor league names (e.g., `aaa`) mapped to `aaaAffiliateName`, etc.
* **Draft Picks (2027/2028):** Year & Round extracted via Regex from legacy `players.last_name`. Original/Current Owners mapped using `TEAM_ALIAS_MAP` for rebranded franchises.

---

## 🧠 3. Unified Player Search & Action Architecture

To maintain a DRY codebase, the application utilizes a centralized search logic handling local DB records and real-time MLB API lookups.

### The "Self-Healing" Hybrid Check
If a local player record is found but lacks an `mlbId`:
* The system triggers a background search against `statsapi.mlb.com/api/v1/people/search`.
* User confirms the match, and the `mlbId` is permanently saved.

### Contextual Action Routing
Once a player is selected, UI dynamically renders actions based on `Status` and `teamId`:
| Player Status | Ownership | Primary Action | Resulting Flow |
| :--- | :--- | :--- | :--- |
| **RETIRED** | Any / None | `Induct to Ring of Honor` | Opens tribute modal; triggers career stats snapshot to `mlbRawData`. |
| **ACTIVE** | `null` | `Add to Roster` | Moves player to the manager's team; triggers active stats sync. |
| **ACTIVE** | `otherTeamId` | `Propose Trade` | Opens the Trade Constructor with that player pre-loaded. |
| **ACTIVE** | `currentTeamId` | `Manage Player` | Routing to player detail for promotion/demotion/IL placement. |

---

## ✅ 4. Completed Milestones 

### Phase 1: Data Migration & MLB API Syncs
* **Position Seeding & Legacy Migration:** 3555 active players and 160 valid future draft picks migrated. Team lore and rebrands handled via `TEAM_ALIAS_MAP`.
* **MLB ID Matchmaker (`sync-mlb-ids.ts`):** Automated script matching player names to official `mlbId` integers, enabling live `img.mlbstatic.com` headshots.
* **MLB Raw Data Deep-Sync (`sync-mlb-raw-data.ts`):** Fetches full JSON profiles for matched players, saving to `mlbRawData`. Dynamically flags players with a `RETIRED` status to clean up the free-agent pool.

### Phase 2: API, Roster Engine, & Frontend Foundations
* **Identity & Rosters:** `GET /api/users/me` and `GET /api/rosters/[teamId]` endpoints built.
* **Dynamic Roster Validation (The Bouncer):** `PATCH /api/players/[playerId]` queries `LeagueSettings` to enforce active limits (e.g., 25-man MLB) and stash limits (IL, NA) during promotions/demotions, logging `TransType` entries via Prisma `$transaction`.
* **Deep-Linked Routing:** Nested structure (`/teams/[id]` for Active Roster, `/teams/[id]/minors` for Farm System) maintains team context across views.
* **Live Assets:** `RosterRow` utilizes the synced `mlbId` for rendering official high-res MLB player headshots via Next/Image `unoptimized`.

### Phase 3: The Multi-Team Trade Engine
* **`POST /api/trades/propose`:** Supports infinite-team blockbusters. Captures historical string snapshots (`fromTeamNameSnapshot`, etc.) for legacy logging. Applies "Roster Freeze" (`isTradeLocked = true`) to initiating team assets. Dynamically maps `TradeApproval` tickets ("Double-Lock" prep).
* **`POST /api/trades/approve`:** The Execution Engine. Safely updates individual manager tickets. Only when *all* tickets are `APPROVED` does the `$transaction` fire to transfer assets, unlock them, and generate `TransType.TRADE` historical logs.
* **`POST /api/trades/decline`:** Instantly kills the trade, marks it `CANCELLED`, and unlocks all involved assets.

### Phase 4: The War Room (Frontend Trade UI)
* **The Drag-and-Drop Builder (`TradeBuilder.tsx`):** Fully responsive UI using `dnd-kit` to construct trades. Prevents illegal drops.
* **The Review State (`TradeSummary.tsx`):** Clean presentation component with receipt cards detailing acquired assets.
* **The Flow Engine (`TradeFlowDiagram.tsx`):** Custom `@xyflow/react` implementation rendering a Left-to-Right bipartite graph. Groups Sending Teams left, Receiving Teams right, and routes beautifully colored bezier curves (`default`) through standalone Asset Nodes to completely eliminate overlapping lines.

---

## 🛠️ 5. Development Roadmap (The Work Ahead)

### Phase 5: UI Polish & Trade Enhancements
* **Add Stats to Trade Summary:** Inject live season stats (AVG/HR or ERA/WHIP) into the `meta` object of the `UIAsset` payload to render quality indicators inside Trade Summary receipt cards.
* **Trade Comments (`POST /api/trades/comments`):** Build threaded negotiation backend.
* **Live MLB StatsAPI Integration:** Materialize new draftees. Sync with undocumented MLB Pipeline endpoint to add "Top 100" badges and ETA dates directly to minor league rosters.
* **Mobile Move Menu:** Tap-friendly alternative to drag-and-drop.

### Phase 6: Historical API (The Quarantine Bridge)
* `GET /api/history/books` & `GET /api/history/posts`: Fetch legacy archives.
* `GET /api/history/transactions`: Federated query stitching modern `Transaction` logs with `LegacyTransaction` records via `legacyId`.

### Phase 7: The AI GM Assistant (Gemini via Vercel AI SDK)
* *Trade Evaluator:* Generates scouting reports on pending deals.
* *Roster Hole Detection:* Scans the league to find ideal trade partners based on surpluses/deficits.
* *Commish Bot:* Automated weekly power rankings.

### Phase 8: Frictionless Auth & Comms Layer
* *Magic Links:* NextAuth + Resend for non-Gmail users.
* *Transactional Emails:* Automated pings for trade offers/expirations.

---

## ⚠️ 6. Critical Architecture & Session Notes
* **Asset-Driven Trades:** Trades do not have a single `receivingTeamId`. The web of a trade is defined entirely by `fromTeamId` and `toTeamId` on individual `TradeAsset` records.
* **Lazy Evaluation for Expirations:** No chron jobs needed. When the Trade UI loads, instantly flip any `PENDING` trades to `CANCELLED` (and unlock their assets) if `expiresAt < now()`.
* **Next.js 15 Async Params (CRITICAL):** `params` and `searchParams` in Route Handlers are **Promises**. You must `await` them before accessing IDs.
* **Prisma Singleton:** Always import Prisma from `@/lib/prisma`.
* **Transactions for Multi-Writes:** Always use `prisma.$transaction(async (tx) => { ... })` when an API route updates a row and creates a log.