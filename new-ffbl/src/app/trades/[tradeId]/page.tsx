import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import TradeSummary from '@/components/trades/TradeSummary';
import { UIAsset } from '@/components/trades/TradeBuilder';

export default async function TradeDetailsPage({ params }: { params: Promise<{ tradeId: string }> }) {
  const resolvedParams = await params;
  const { tradeId } = resolvedParams;

  const session = await getServerSession(authOptions);
  const myTeamId = (session?.user as any)?.teamId;

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: {
      assets: {
        include: { fromTeam: true, toTeam: true, player: true, draftPick: true }
      }
    }
  });

  if (!trade) return <div className="p-8">Trade not found.</div>;

  // 1. Determine Permissions
  const isInitiator = trade.initiatingTeamId === myTeamId;

  // 2. Map Database Assets to UIAssets for the Summary Component
  const uiAssets: UIAsset[] = trade.assets.map(asset => ({
    id: asset.id,
    type: asset.playerId ? 'PLAYER' : 'PICK',
    dbId: asset.playerId || asset.draftPickId || '',
    name: asset.player ? `${asset.player.firstName} ${asset.player.lastName}` : (asset.pickNameSnapshot || 'Draft Pick'),
    sourceTeamId: asset.fromTeamId,
    currentZone: `trade-block-${asset.toTeamId}`, // ⬅️ The magic that tells TradeSummary where to put it
    meta: asset.player || asset.draftPick
  }));

  // 3. Derive unique teams involved
  const involvedTeamIds = Array.from(new Set(trade.assets.flatMap(a => [a.fromTeamId, a.toTeamId])));

  // 4. Build a dictionary instead of a function
  const teamDictionary: Record<string, string> = {};
  trade.assets.forEach(a => {
    teamDictionary[a.fromTeamId] = a.fromTeam.name;
    teamDictionary[a.toTeamId] = a.toTeam.name;
  });

  // 5. Build our Custom Header
  const initiatorName = teamDictionary[trade.initiatingTeamId] || 'Another Team';

  const customTitle = (
    <div className="flex items-center gap-4">
      <Link href="/trades" className="text-slate-400 hover:text-slate-600 font-bold">&larr;</Link>
      <span className="text-xl font-bold text-slate-900">
        {isInitiator ? "Your Proposal" : `Offer from ${initiatorName}`}
      </span>
      <span className="text-sm px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full ml-4 uppercase tracking-wider font-bold">
        {trade.status}
      </span>
    </div>
  );

  // 6. Build our Custom Action Buttons
  const customButtons = isInitiator ? (
    <button className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-lg transition-colors">
      Cancel Trade
    </button>
  ) : (
    <>
      <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors">
        Approve Deal
      </button>
      <button className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">
        Counter Offer
      </button>
      <button className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-lg transition-colors">
        Decline
      </button>
    </>
  );

  return (
    <div className="h-full bg-slate-50 min-h-screen">
      <TradeSummary 
        tradeAssetsList={uiAssets}
        involvedTeamIds={involvedTeamIds}
        teamDictionary={teamDictionary}
        title={customTitle}
        actionButtons={customButtons}
      />
    </div>
  );
}