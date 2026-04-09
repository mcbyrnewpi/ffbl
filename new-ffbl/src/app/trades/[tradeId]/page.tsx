// src/app/trades/[tradeId]/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import TradeSummary from '@/components/trades/TradeSummary';
import { UIAsset } from '@/components/trades/TradeBuilder';
import TradeActionButtons from '@/components/trades/TradeActionButtons';

export default async function TradeDetailsPage({ params }: { params: Promise<{ tradeId: string }> }) {
  const resolvedParams = await params;
  const { tradeId } = resolvedParams;

  const session = await getServerSession(authOptions);
  const myTeamId = (session?.user as any)?.teamId;
  const userId = (session?.user as any)?.id; 

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: {
      assets: {
        include: { fromTeam: true, toTeam: true, player: true, draftPick: true }
      },
      approvals: true // ⬅️ CRITICAL: Added this so we can count them!
    }
  });

  if (!trade) return <div className="p-8">Trade not found.</div>;

  const isInitiator = trade.initiatingTeamId === myTeamId;
  
  // ⬅️ NEW CALCULATIONS
  const userApproval = trade.approvals.find(a => a.userId === userId);
  const hasApproved = userApproval?.status === 'APPROVED';
  const pendingApprovalsCount = trade.approvals.filter(a => a.status === 'PENDING').length;

  const uiAssets: UIAsset[] = trade.assets.map(asset => ({
    id: asset.id,
    type: asset.playerId ? 'PLAYER' : 'PICK',
    dbId: asset.playerId || asset.draftPickId || '',
    name: asset.player ? `${asset.player.firstName} ${asset.player.lastName}` : (asset.pickNameSnapshot || 'Draft Pick'),
    sourceTeamId: asset.fromTeamId,
    currentZone: `trade-block-${asset.toTeamId}`,
    meta: asset.player || asset.draftPick
  }));

  const involvedTeamIds = Array.from(new Set(trade.assets.flatMap(a => [a.fromTeamId, a.toTeamId])));

  const teamDictionary: Record<string, string> = {};
  trade.assets.forEach(a => {
    teamDictionary[a.fromTeamId] = a.fromTeam.name;
    teamDictionary[a.toTeamId] = a.toTeam.name;
  });

  const initiatorName = teamDictionary[trade.initiatingTeamId] || 'Another Team';

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
    REJECTED: "bg-red-100 text-red-700",
    VETOED: "bg-red-100 text-red-700",
    APPROVED: "bg-green-100 text-green-700",
    PROCESSED: "bg-blue-100 text-blue-700",
  };

  const customTitle = (
    <div className="flex items-center gap-4">
      <Link href="/trades" className="text-slate-400 hover:text-slate-600 font-bold">&larr;</Link>
      <span className="text-xl font-bold text-slate-900">
        {isInitiator ? "Your Proposal" : `Offer from ${initiatorName}`}
      </span>
      <span className={`text-sm px-3 py-1 rounded-full ml-4 uppercase tracking-wider font-bold ${statusColors}`}>
        {trade.status}
      </span>
    </div>
  );

  const settings = await prisma.leagueSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="h-full bg-slate-50 min-h-screen">
      <TradeSummary 
        tradeAssetsList={uiAssets}
        involvedTeamIds={involvedTeamIds}
        teamDictionary={teamDictionary}
        title={customTitle}
        actionButtons={
          <TradeActionButtons 
            tradeId={trade.id} 
            userId={userId}
            teamId={myTeamId}
            tradeAssets={trade.assets}
            settings={settings}
            isInitiator={isInitiator}
            status={trade.status} 
            redirectTo="/trades"
            hasApproved={hasApproved} // ⬅️ NEW
            pendingApprovalsCount={pendingApprovalsCount} // ⬅️ NEW
          />
        }
      />
    </div>
  );
}