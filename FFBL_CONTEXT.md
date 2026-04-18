# 📜 FFBL Rebuild: Master Context File

## ⚾ 1. The Project Manifesto
**Project Title:** FFBL Modernization (2026 Rebuild)  
**Core Stack:** Next.js 15 (App Router), Prisma 7, PostgreSQL, NextAuth.js, Tailwind CSS, Vercel AI SDK, React Flow (@xyflow/react), Resend + React Email.  
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
* **Co-Managers:** Handled gracefully via multiple `User` records tied to the same `teamId`. The `isPrimaryManager` boolean dictates ultimate franchise authority.
* **Team Lore:** Custom minor league names (e.g., `aaa`) mapped to `aaaAffiliateName`, `aaaLogoUrl`, etc., for dynamic branding.
* **Draft Picks (2027/2028):** Year & Round extracted via Regex from legacy `players.last_name`. Original/Current Owners mapped using `TEAM_ALIAS_MAP` for rebranded franchises.

---

## 🧠 3. Unified Player Search & Action Architecture

To maintain a DRY codebase, the application utilizes a centralized search logic handling local DB records and real-time MLB API lookups.

### The "Self-Healing" Hybrid Check
If a local player record is found but lacks an `mlbId`:
* The system triggers a background search against `statsapi.mlb.com/api/v1/people/search` (including minor league `sportIds` 11, 12, 13, 14, 16, 5442).
* User confirms the match, and the `mlbId` is permanently saved.

### Contextual Action Routing
Once a player is selected, UI dynamically renders actions based on `Status` and `teamId`:
| Player Status | Ownership | Primary Action | Resulting Flow |
| :--- | :--- | :--- | :--- |
| **RETIRED** | Any / None | `Induct to Ring of Honor` | Opens tribute modal; triggers career stats snapshot to `mlbRawData`. |
| **ACTIVE** | `null` | `Add to Roster` | Opens popup to select target level; triggers active stats sync. |
| **ACTIVE** | `otherTeamId` | `Propose Trade` | Deep-links directly to the War Room with the asset pre-loaded. |
| **ACTIVE** | `currentTeamId` | `Manage Player` | In-line dropdown for specific promotions/demotions, IL, or dropping. |

---

## ✅ 4. Completed Milestones 

### Phase 1: Data Migration & MLB API Syncs
* **Position Seeding & Legacy Migration:** 3555 active players and 160 valid future draft picks migrated. Team lore and rebrands handled via `TEAM_ALIAS_MAP`.
* **MLB ID Matchmaker (`sync-mlb-ids.ts`):** Automated script matching player names to official `mlbId` integers, enabling live `img.mlbstatic.com` headshots.
* **MLB Raw Data Deep-Sync (`sync-mlb-raw-data.ts`):** Fetches full JSON profiles for matched players, saving to `mlbRawData`. Dynamically flags players with a `RETIRED` status to clean up the free-agent pool.
* **Team-Scoped Stat Syncs:** Global header button allows Owners (and Admins) to pull fresh MLB stats for their specific roster via `POST /api/teams/[teamId]/sync-stats`. Uses `lastStatSync` to enforce a 24-hour cooldown.

### Phase 2: API, Roster Engine, & Frontend Foundations
* **Identity, Settings, & Rosters:** `GET /api/users/me`, `GET /api/settings`, and `GET /api/rosters/[teamId]` endpoints built. Magic Link Auth fully wired up via Resend.
* **The Bouncer (Minor League Eligibility):** Programmatic rule enforcement via `src/lib/roster-rules.ts`. Checks MLB career limits (650 AB, 250 IP, 85 App), age caps (AAA:25, AA:24, A:22), Rehab blocks, and MiLB active exemptions. 
* **The Poison Pill:** `validateTeamFarmSystem` scans a franchise's entire farm system. If *any* player violates a rule, the entire API blocks new minor league additions until the manager drops or promotes the offending player. Bouncer simulates pending moves to avoid database deadlocks during promotions.
* **The 60-Day IL Lock:** API accepts a retroactive date and uses bulletproof millisecond-math to calculate an `il60UnlockDate`. Frontend UI traps the player, showing the "Eligible" date and blocking all moves except "Drop Player" until 60 days have passed.
* **Omni-Search & Global Hub:** The `PlayersPage` handles local DB search + live MLB API imports. Integrated an intuitive `AddPlayerMenu` that lets managers scoop up Free Agents directly to a targeted level (MLB, AAA, AA, A).

### Phase 3: The Multi-Team Trade Engine
* **`POST /api/trades/propose`:** Supports infinite-team blockbusters. Captures historical string snapshots for legacy logging. Safely handles **Counter Offers** by killing the old trade (`CANCELLED`) and dropping its padlocks before establishing the new deal. Automatically locks primary trade assets AND `escrowPlayerIds` from corresponding moves. 
* **`POST /api/trades/approve`:** The Execution Engine. Extracts and locks Escrow assets for the approving manager. When *all* tickets are `APPROVED`, the `$transaction` fires to transfer assets, execute corresponding level/status changes, unlock all players, and generate historical logs.
* **`POST /api/trades/decline`:** Instantly kills the trade, marks it `CANCELLED`, and dynamically scans all `TradeApproval` tickets to unlock primary assets AND any pending escrow moves.

### Phase 4: The War Room & Deep-Linked Action Menus
* **The Drag-and-Drop Builder (`TradeBuilder.tsx`):** Fully responsive UI using `dnd-kit`. Clickable team zones trigger dynamic left-panel context filters. 
* **Deep-Linked Trade Initiation:** Reads `?addPlayer=id` or `?counter=id` from the URL to instantly bypass Prisma limits, pre-load opponent rosters, and drop targeted assets straight into the user's "Receives" block. 
* **The Escrow System (`CorrespondingMovesModal`):** "The Bouncer" integrated directly into the trade flow to enforce corresponding drops/demotions prior to API execution.
* **The Flow Engine (`TradeFlowDiagram.tsx`):** Custom `@xyflow/react` implementation rendering a Left-to-Right bipartite graph, routing perfectly curved lines through standalone Asset Nodes with dynamic stat ribbons.

### Phase 5: The Baseball Card & UI Polish
* **The 3D Baseball Card (`BaseballCard.tsx`):** A flippable, interactive master player profile. Features high-res headshots, dynamic positional badges, FFBL status on the front, and nested stats/scouting reports on the back.
* **Global UI Standardization:** Implemented universal `<PageContainer>` and `<PageHeader>` layout wrappers. De-bloated typography from heavy `font-black` to premium SaaS `font-bold`. Unified tabs, paddings, and alignment across the Homepage, Franchises, Trades, Transactions, and Commish Centers.

### Phase 6: AI Media & League Communications
* **The AI Media Network:** Integrated Vercel AI SDK with Google's `gemini-2.5-flash` to automatically generate highly structured, entertaining trade analysis upon trade completion. Features three distinct personalities: `theStathead`, `theScout`, and `theShockJock`. 
* **Transactional Email Blasts:** Built custom `React Email` templates triggered via Resend to alert managers to league events.

### Phase 7: The Commissioner Suite & Core Governance
* **The Commish Center:** A protected, tabbed dashboard (`CommishCenter`) serving as the central hub for all administrative actions, isolating dangerous API sync tools behind safe UX layers.
* **League Settings Engine:** `LeagueSettingsManager` interfaces with a self-healing `PATCH /api/settings` route that dynamically generates missing database rows with default FFBL limits (`25/6/6/6`). Grants Commish control over the trade deadline and master roster limit toggles.
* **Announcements & Broadcasts:** `AnnouncementManager` allows the Commish to draft and pin rich-text league updates. Integrates directly with Resend and a custom `AnnouncementEmail.tsx` React component to blast fully branded, high-contrast emails to all managers.
* **League Lore & Historic Records:** Created the `DocumentManager` for rich-text HTML generation. Dynamically injected the official FFBL Constitution (`rules`) and History (`history`) into sleek, document-style reading views on the frontend.
* **Championship Management:** `SeasonManager` allows the creation and editing of historical championship records (`PATCH /api/seasons`). Powers the fully redesigned, single-row, high-contrast `ChampionsHallPage` to memorialize league history.

### Phase 8: Historic Records & Archives
* **The Record Books:** Dedicated pages for Team and Individual Records (powered by the seeded `LeagueRecord` table) to showcase impressive historical numbers.
* **Historical Transaction APIs:** `GET /api/history/transactions` federated query stitching modern `Transaction` logs with `LegacyTransaction` records via `legacyId`.

### Phase 9: The Draft Engine & Commish Controls
* **Settings API Optimization:** `PATCH /api/settings` accepts partial updates, protecting roster limits from being accidentally wiped out when toggling booleans.
* **Standings Integration:** * Standings grid allows manual record updates and includes an "Auto-Rank" button that sorts by Win % and assigns 1-16.
  * Active season (e.g., 2026) inherently sets the Target Draft Year to `currentSeason + 1` (e.g., 2027).
* **Draft Lottery Manager:** Commish can use a drag-and-drop `dnd-kit` UI to set the post-lottery draft order. The `PATCH /api/admin/draft-order` dynamically updates the `pickNumber` across all 5 rounds based on the `originalOwnerId`.
* **Live Draft Room UI:** * Dynamic Polling (15s when active, 60s when paused) keeps server load light.
  * Distinct active pick highlighting and team-specific "Make Pick" controls to prevent unauthorized selections.
  * Clean `<img>` tags with `onError` fallback hide broken MLB CDN headshot links.
* **The "Make Pick" Engine:**
  * **Omni-Search:** The search modal queries `GET /api/players` with `?searchMlb=true` and uses a 400ms debounce to prevent API spam.
  * **MLB Cloud Injection:** If a prospect only exists on MLB.com (`isExternal: true`), the frontend hits `POST /api/players` to automatically construct their DB record first, then passes the new local ID to the draft transaction.
  * **Transactions:** `POST /api/draft/make-pick` assigns the player, updates their `teamId`, and generates a Transaction log.
* **Commish War Room Controls:**
  * Dedicated "Start / Pause" draft controls.
  * Commish-only "Undo Pick" button that safely strips the player from the roster, clears the draft slot, and deletes the transaction log.

---

## 🛠️ 6. Development Roadmap (The Work Ahead)

### Phase 10: The Front Office & Dashboard Polish
*(Enhancing day-to-day user experience and team management)*
* **Dashboard Content Strategy:** Wire up the "Most Recent Announcement" to the top of the homepage. Build a Live Standings Widget based on active league data. Include interactive "Sticky" elements (Manager of the Week, Ego/Lore widgets).
* **Co-Manager Delegation:** Build the UI to invite a co-manager to a franchise and assign granular permissions (leveraging the existing `User.isPrimaryManager` schema boolean).

### Phase 11: Media & Asset Management
* **Cloudinary Media Library Integration:** Enhance the `CldUploadWidget` across the Commish Center and Team Edit pages to utilize `image_search` and `local` sources, allowing managers to browse and reuse previously uploaded legacy assets (logos, historic photos) without duplicating uploads.

---

## ⚠️ 7. Critical Architecture & Session Notes
* **Next.js 15 Data Caching (Vercel):** Aggressive SSG caching will bake empty database states into production during Vercel builds. For live DB fetches (like History documents or Rules), ensure `export const revalidate = 0;` is present to force fresh dynamic rendering.
* **API Route Signatures:** Next.js throws build errors if a route defines dynamic `params` (e.g., `Promise<{ teamId: string }>`) but doesn't live inside a bracketed folder (like `[teamId]`). For static path endpoints (like `/api/rosters`), use `request.url` and `searchParams.get('teamId')` instead.
* **Environment Variable Scoping:** Local `.env` is for development database URLs and local overrides. `.env.local` is for specific Next.js overrides. Vercel Dashboard strictly handles Staging/Production variables. 
* **AI Model Selection:** `gemini-2.5-pro` is incredibly powerful but "heavy" and prone to overload/timeouts during high-volume generation. `gemini-2.5-flash` is the preferred primary model for fast, reliable, and cost-effective creative text generation.
* **Prisma Relational Strictness:** Always verify `include` blocks. Nested relational data (like team objects inside a `hallOfFame` array) will return `undefined` unless explicitly called and selected in the Prisma query.
* **Tailwind Input Contrast:** UI `<input>` and `<textarea>` elements often inherit light text colors from parent wrappers. Always apply explicit text colors (e.g., `text-slate-900`).
* **The "Locked Keys" Deadlock:** When running the `validateTeamFarmSystem` (Poison Pill) check during a roster move, you *must* pass the `pendingMove` object to the bouncer. Otherwise, a player currently violating a rule will trigger the system to block the very transaction attempting to fix them.
* **Asset-Driven Trades:** Trades do not have a single `receivingTeamId`. The web of a trade is defined entirely by `fromTeamId` and `toTeamId` on individual `TradeAsset` records.
* **Escrow Locks:** When a manager agrees to drop/demote a player as a condition of a trade, that player receives an `isTradeLocked = true` padlock just like the players actually changing teams.
* **CSS Z-Index & Overflow Traps:** For horizontally scrolling tables (`overflow-x-auto`) that trap dropdowns, use the "Padding Hack" (`pb-48 -mb-48`) to give the menu physical room to render without creating blank white space on the page.
* **The MLB CDN Trick:** We *never* save image URLs to the database. We only save the `mlbId` and dynamically inject it into the `img.mlbstatic.com` string.
* **Image Fallbacks (Next.js 404 Spam):** The Next.js `<Image>` component throws server-side 500/404s if an external URL is broken. For dynamic MLB headshots that might not exist yet, use standard `<img src="..." onError={(e) => e.currentTarget.style.display = 'none'} />` to gracefully hide broken images without polluting server logs.
* **Debouncing Search Inputs:** Always use a `setTimeout` debounce (e.g., 400ms) on text inputs that trigger external API searches (like MLB Stats) to prevent rate-limiting and frontend lag.
* **Draft Implementation Strategy:** Never use a `DRAFTED` status on the `Player` model. Draft events are historic and belong strictly to the `DraftPick` model via the `playerId` relation.