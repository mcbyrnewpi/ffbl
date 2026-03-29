// src/app/trade-center/page.tsx
import { prisma } from '@/lib/prisma';
import TradeBuilder from '@/components/trades/TradeBuilder';

export default async function TradeCenterPage() {
  // 1. Fetch all teams
  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
  });

  // 2. Fetch all tradeable players (not currently locked in a pending trade)
  const players = await prisma.player.findMany({
    where: { 
      isTradeLocked: false,
      teamId: { not: null } // Only get players on a roster
    },
    include: {
      positions: true, // Need this for the UI badges
    },
  });

  // 3. Fetch all tradeable draft picks
  const draftPicks = await prisma.draftPick.findMany({
    where: { isTradeLocked: false },
    include: {
      originalOwner: true,
      currentOwner: true,
      season: true,
    },
    orderBy: [
      { year: 'asc' },
      { round: 'asc' }
    ]
  });

  // Pass everything down to the interactive client component
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">The War Room</h1>
        <p className="text-slate-500">Construct and propose multi-team blockbuster trades.</p>
      </div>

      <TradeBuilder 
        initialTeams={teams} 
        initialPlayers={players} 
        initialPicks={draftPicks} 
      />
    </div>
  );
}