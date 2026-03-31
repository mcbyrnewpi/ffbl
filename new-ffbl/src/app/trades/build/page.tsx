import { prisma } from '@/lib/prisma';
import TradeBuilder from '@/components/trades/TradeBuilder';

export default async function TradeBuildPage() {
  // 1. Fetch all teams
  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' }
  });

  // 2. Fetch all rostered players who aren't currently locked in another trade
  const players = await prisma.player.findMany({
    where: {
      teamId: { not: null },
      isTradeLocked: false
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
  });

  // 3. Fetch all draft picks that aren't locked
  const picks = await prisma.draftPick.findMany({
    where: {
      isTradeLocked: false
    },
    orderBy: [{ year: 'asc' }, { round: 'asc' }]
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">The War Room</h1>
        <p className="text-slate-500 mt-1">Construct and propose your next blockbuster deal.</p>
      </div>
      
      {/* 🚀 Mount the Client Component and pass in the DB data */}
      <TradeBuilder 
        initialTeams={teams} 
        initialPlayers={players} 
        initialPicks={picks} 
      />
    </div>
  );
}