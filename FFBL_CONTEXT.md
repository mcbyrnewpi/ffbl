# 📜 FFBL Rebuild: Master Context File (EOD Update - March 22, 2026)

## ⚾ 1. The Project Manifesto
**Project Title:** FFBL Modernization  
**Core Stack:** Next.js 15 (App Router), Prisma 7, PostgreSQL.  
**Architecture:** Dual-Era (Legacy `quarantine` vs. Modern PascalCase).

---

## ✅ 2. Completed Milestones

### Phase 1: Data Migration (COMPLETE)
* 3,555 players migrated with `legacyId` links.
* 16 Team/User entities mapped with `isPrimaryManager` logic.
* Future Draft Picks (2027-2028) correctly assigned to rebranded franchises.

### Phase 2: API & Backend Logic (IN PROGRESS)
* **Identity:** `GET /api/users/me` (Mocked via email for now).
* **Rosters:** `GET /api/rosters/[teamId]` returns full hierarchy (Players + Picks).
* **Market Search:** `GET /api/players` supports `name`, `level`, and `unowned=true` (Free Agency) filters.
* **Player Management:** `PATCH /api/players/[playerId]` handles level promotions (MLB/AAA/AA/A) and Team assignments.

---

## 🛠️ 3. Technical Discoveries & Standards

### 1. Next.js 15 Async Params (CRITICAL)
In Next.js 15, `params` is a Promise. We MUST await it in Route Handlers:
```typescript
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}