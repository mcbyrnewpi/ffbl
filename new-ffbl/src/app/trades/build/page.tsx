// src/app/trades/build/page.tsx
import { prisma } from '@/lib/prisma';
import TradeBuilder from '@/components/trades/TradeBuilder';

export default async function TradeBuildPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ counter?: string }> 
}) {
  const resolvedParams = await searchParams;
  const counterTradeId = resolvedParams.counter;

  // 1. ⬅️ NEW: Fetch the counter trade FIRST so we know which locked assets to bypass
  let counterTrade = null;
  let counterPlayerIds: string[] = [];
  let counterPickIds: string[] = [];

  if (counterTradeId) {
    counterTrade = await prisma.trade.findUnique({
      where: { id: counterTradeId },
      include: { assets: true }
    });

    if (counterTrade) {
      counterPlayerIds = counterTrade.assets.filter(a => a.playerId).map(a => a.playerId as string);
      counterPickIds = counterTrade.assets.filter(a => a.draftPickId).map(a => a.draftPickId as string);
    }
  }

  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });

  // 2. ⬅️ UPDATED: Fetch players (Unlocked OR involved in the counter trade)
  const players = await prisma.player.findMany({
    where: { 
      teamId: { not: null },
      OR: [
        { isTradeLocked: false },
        { id: { in: counterPlayerIds } } // Allow the locked players from this specific trade!
      ]
    },
    include: { positions: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
  });

  // 3. ⬅️ UPDATED: Fetch picks (Unlocked OR involved in the counter trade)
  const picks = await prisma.draftPick.findMany({
    where: { 
      OR: [
        { isTradeLocked: false },
        { id: { in: counterPickIds } } // Allow the locked picks from this specific trade!
      ]
    },
    orderBy: [{ year: 'asc' }, { round: 'asc' }]
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          {counterTrade ? "Counter Offer" : "The War Room"}
        </h1>
        <p className="text-slate-500 mt-1">
          {counterTrade ? "Adjust the assets below to propose a counter deal." : "Construct and propose your next blockbuster deal."}
        </p>
      </div>
      
      <TradeBuilder 
        initialTeams={teams} 
        initialPlayers={players} 
        initialPicks={picks} 
        initialCounterTrade={counterTrade} 
      />
    </div>
  );
}