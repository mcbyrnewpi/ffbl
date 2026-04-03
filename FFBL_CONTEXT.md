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
* **Identity, Settings, & Rosters:** `GET /api/users/me`, `GET /api/settings`, and `GET /api/rosters/[teamId]` endpoints built.
* **Dynamic Roster Validation (The Bouncer):** `PATCH /api/players/[playerId]` queries `LeagueSettings` to enforce active limits and stash limits (IL, NA) during promotions/demotions, logging `TransType` entries via Prisma `$transaction`.
* **Deep-Linked Routing & Collapsible UI:** Nested structure maintains team context. Roster sections utilize a `CollapsibleSection` client wrapper for clean, toggleable views with dynamic count badges to reduce visual clutter on massive franchise pages.
* **Live Assets:** `RosterRow` utilizes the synced `mlbId` for rendering official high-res MLB player headshots via Next/Image `unoptimized`. Bulletproof frontend `<img onError={...} />` fallback states added.
* **Omni-Search & Importer:** Combines local DB search with live MLB API external fallback.
* **"Player-First" Link Workflow:** `<MlbLinkModal />` integrated globally to visually warn managers of unlinked legacy players and provide a 1-click sync interface.

### Phase 3: The Multi-Team Trade Engine
* **`POST /api/trades/propose`:** Supports infinite-team blockbusters. Captures historical string snapshots for legacy logging. Safely handles **Counter Offers** by killing the old trade (`CANCELLED`) and dropping its padlocks before establishing the new deal. Automatically locks primary trade assets AND `escrowPlayerIds` from corresponding moves. 
* **`POST /api/trades/approve`:** The Execution Engine. Extracts and locks Escrow assets for the approving manager. When *all* tickets are `APPROVED`, the `$transaction` fires to transfer assets, execute corresponding level/status changes, unlock all players, and generate historical logs.
* **`POST /api/trades/decline`:** Instantly kills the trade, marks it `CANCELLED`, and dynamically scans all `TradeApproval` tickets to unlock primary assets AND any pending escrow moves.

### Phase 4: The War Room (Frontend Trade UI)
* **The Drag-and-Drop Builder (`TradeBuilder.tsx`):** Fully responsive UI using `dnd-kit`. Clickable team zones trigger dynamic left-panel context filters. Features a **Counter Offer Engine** that reads URL parameters (`?counter=id`), fetches the locked assets using Prisma `OR` bypasses, and auto-populates the trade blocks.
* **The Escrow System (`CorrespondingMovesModal`):** "The Bouncer" integrated directly into the trade flow. Intercepts proposal/approval clicks via `trade-utils.ts`, projects roster math across all levels (MLB, AAA, AA, A, IL, NA), and forces users to map out corresponding moves (drops/demotions) before pinging the API.
* **The Trade Dashboard (`page.tsx`):** Centralized hub for pending and completed trades. Dynamically groups assets using `reduce` by `toTeamId` to render complex blockbusters as clean, vertical-stacked "Receives" lists.
* **The Flow Engine (`TradeFlowDiagram.tsx`):** Custom `@xyflow/react` implementation rendering a Left-to-Right bipartite graph, routing perfectly curved lines through standalone Asset Nodes with dynamic stat ribbons.

---

## 🛠️ 5. Development Roadmap (The Work Ahead)

### Phase 5: UI Polish & Trade Enhancements
* **Trade Comments (`POST /api/trades/comments`):** Build threaded negotiation backend.
* **Deep-Linked Trade Initiation:** Add URL parameter parsing (e.g., `?addPlayer=123`) to auto-load specific assets into the War Room from external roster pages, mirroring the Counter Offer architecture.
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
* **Escrow Locks:** When a manager agrees to drop/demote a player as a condition of a trade, that player receives an `isTradeLocked = true` padlock just like the players actually changing teams.
* **Lazy Evaluation for Expirations:** No chron jobs needed. When the Trade UI loads, instantly flip any `PENDING` trades to `CANCELLED` (and unlock their assets) if `expiresAt < now()`.
* **Next.js 15 Async Params (CRITICAL):** `params` and `searchParams` in Route Handlers are **Promises**. You must `await` them before accessing IDs.
* **Prisma Relational Includes:** If a UI component needs nested data (like a player's `positions` array), you must explicitly define `include: { positions: true }` in the Server Component fetch.
* **The MLB CDN Trick:** We *never* save image URLs to the database. We only save the `mlbId` and dynamically inject it into the `img.mlbstatic.com` string.
* **Shohei Ohtani Rule:** Because `mlbId` is strictly `@unique`, legacy split players (e.g., Batter vs. Pitcher versions) will only have one linked profile.