# ⚾ FFBL Modernization (2026 Rebuild) - Master Project File

Welcome to the Franklin Fantasy Baseball League (FFBL) modern platform. This project replaces a 10-year-old Ruby on Rails application with a high-performance Next.js 15 application, featuring a "Dual-Era" database that preserves a decade of historical data while powering a modern, asset-driven trade engine and AI-assisted GM tools.

---

## 🚀 1. Getting Started (Local Setup)

### Clone & Install
Clone the repository and install the necessary dependencies:
```bash
git clone [YOUR_REPO_URL]
cd new-ffbl
npm install
```

### Environment Variables

Create a `.env` file in the root of your project. You will need the connection string to our PostgreSQL database, plus external API keys. *(Ask the Lead Admin for the current dev credentials).*

```env
# .env
DATABASE_URL="postgresql://user:password@host:5432/franklin_fantasy_legacy"
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# External Integrations
RESEND_API_KEY="your_resend_api_key"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_key"
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

Open `http://localhost:3000` with your browser to view the app. Use `npx prisma studio` to view and manage the database visually.

---

## 🏗️ 2. Architecture & Tech Stack

**Core Stack:** Next.js 15 (App Router), Prisma 7, PostgreSQL, NextAuth.js, Tailwind CSS, Vercel AI SDK, React Flow (`@xyflow/react`), Resend + React Email, Cloudinary.

**Architecture Strategy: A "Dual-Era" Database**
* **The Quarantine (Legacy):** 2015–2025 data stored in lowercase tables (e.g., `players`, `users`, `transactions`) using `Int` IDs. This is treated as a strictly read-only historical archive.
* **The Modern Era (Current):** 2026+ data stored in PascalCase tables (e.g., `Player`, `Team`, `Transaction`) using `String` (CUID) IDs.
* **Key Technical Rule:** All Modern `Player` records must store their original legacy ID in the `legacyId (Int @unique)` field to permanently maintain the link to the 10-year history.

---

## 📖 3. The Data Dictionary (Mapping Rules)

### Player Mapping
| Legacy Field (`players`) | Modern Field (`Player`) | Logic / Transformation |
| :--- | :--- | :--- |
| `id` | `legacyId` | Preserved for historical lookup. |
| `first_name` + `last_name` | `firstName`, `lastName` | String trim and custom `toTitleCase` transformation. |
| `dob` | `birthdate` | Standard DateTime transfer. |
| `affiliation` | `level` | Maps "MLB", "AAA", etc., to `Level` Enum. |
| `position_id` | `positions` (Relation) | ID-to-Abbreviation "Rosetta Stone" handshake. **ID 9 is strictly quarantined for Draft Picks.** |
| N/A | `mlbId` | Sourced dynamically via MLB API Matchmaker script. |

### User, Team, & Draft Pick Mapping
* **User Identity:** Legacy `email` maps to modern `User.email` (trimmed/lowercased) as the primary NextAuth key.
* **Roles & Front Office:** Legacy `commish` / `admin` booleans map to the `User.role` Enum (`COMMISH`, `ADMIN`, `OWNER`). Co-Managers are handled gracefully via multiple `User` records tied to the same `teamId`, with the `isPrimaryManager` boolean dictating ultimate franchise authority.
* **Team Lore:** Custom minor league names (e.g., `aaa`) mapped to `aaaAffiliateName`, `aaaLogoUrl`, etc., for dynamic branding.
* **Draft Picks (2027/2028):** Year & Round extracted via Regex from legacy `players.last_name`. Original/Current Owners mapped using `TEAM_ALIAS_MAP` for rebranded franchises.

---

## ✅ 4. Completed Milestones

### Phases 1-5: Roster & Trade Engines
* **MLB Live Syncs:** Automated scripts map players to their official `mlbId`, enabling live headshots and real-time MLB stats via `statsapi.mlb.com`.
* **The Bouncer (Roster Logic):** Programmatic rule enforcement checking MLB career limits, age caps, and active roster maximums. Invalid moves trigger a "Poison Pill" blocking API additions.
* **The Multi-Team Trade Engine & War Room:** Full drag-and-drop `@xyflow/react` UI supporting infinite-team blockbusters. Features a Multi-Key approval system and deep-linked asset loading.
* **The 3D Baseball Card:** Interactive player profiles with positional badges, stat ribbons, and minor league ETA tracking.

### Phases 6-9: Commish Suite, AI, & Draft
* **AI Media Network:** Integrates Vercel AI SDK with Google Gemini to generate structured, entertaining trade analysis featuring three distinct bot personalities.
* **Email & Communications:** React Email templates via Resend for Magic Link logins, Trade Alerts, and Commish Broadcasts.
* **League Governance & History:** Protected Commish Center for League Settings, Announcement generation, and rich-text Document editing (Constitution/Rulebook) powered by Tiptap.
* **Live Draft Room:** Real-time polling UI with omni-search, MLB Cloud Injection for missing prospects, and Commish-only undo controls.

### Phases 10-11: Front Office & Media Asset Management
* **Co-Manager Delegation:** Founders can invite users, assign `isPrimaryManager` status, or revoke access directly from the franchise page.
* **FFBL Media Library:** Integrated the secure Node.js Cloudinary SDK to allow managers to seamlessly search and reuse up to 500 historical images across team logos and rich-text documents.

---

## 🛠️ 5. Development Roadmap (The Work Ahead)

### Phase 12: Dashboard Polish & Live Data (CURRENT)
* **Dashboard Content Strategy:** Wire up the "Most Recent Announcement" to the top of the homepage. 
* **Live Standings Widget:** Build a sleek, compact standings table for the dashboard that calculates Win % and ranks the teams dynamically based on the current season.
* **Engagement Widgets:** Include interactive "Sticky" elements (Manager of the Week, Ego/Lore widgets) to liven up the home screen.

---

## ⚠️ 6. Critical Architecture Notes
* **Module-Level Promise Caching:** When rendering lists of components (like 40 player cards) that independently fetch the same API data, move the `fetch()` into a module-level variable to prevent Next.js from spamming the server with 40 simultaneous network requests.
* **Cloudinary API Architecture:** Unsigned `CldUploadWidget` presets are for client-side uploads, but securely querying the account's media library requires the backend Node.js SDK (`cloudinary.search`) authenticated with private API keys.
* **Asset-Driven Trades:** Trades do not have a single `receivingTeamId`. The web of a trade is defined entirely by `fromTeamId` and `toTeamId` on individual `TradeAsset` records.
* **The MLB CDN Trick:** We *never* save image URLs to the database. We only save the `mlbId` and dynamically inject it into the `img.mlbstatic.com` string using an `onError` fallback to gracefully hide broken images.