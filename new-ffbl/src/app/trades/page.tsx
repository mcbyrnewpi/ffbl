// src/app/trades/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import TradeActionButtons from '@/components/trades/TradeActionButtons';
import RecentTrades from '@/components/trades/RecentTrades';

export default async function TradesDashboard() {
  const session = await getServerSession(authOptions);
  const myTeamId = (session?.user as any)?.teamId;
  const userId = (session?.user as any)?.id; 

  if (!myTeamId) {
    return (
      <div className="p-8 text-center text-slate-500 mt-20">
        <h2 className="text-2xl font-bold text-slate-700 mb-2">No Franchise Assigned</h2>
        <p>You must be assigned to a team to view the Trade Center.</p>
      </div>
    );
  }

  // 🔍 Fetch all PENDING trades where my team is involved
  const pendingTrades = await prisma.trade.findMany({
    where: {
      status: 'PENDING',
      assets: {
        some: {
          OR: [
            { fromTeamId: myTeamId },
            { toTeamId: myTeamId }
          ]
        }
      }
    },
    include: {
      assets: {
        include: {
          fromTeam: true,
          toTeam: true,
          player: true,
          draftPick: true
        }
      },
      approvals: {
        include: { user: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // 🔍 Fetch recent PROCESSED trades (limit to last 20 for performance)
  const processedTrades = await prisma.trade.findMany({
    where: { status: 'PROCESSED' },
    include: {
      assets: {
        include: { fromTeam: true, toTeam: true, player: true, draftPick: true }
      }
    },
    orderBy: { updatedAt: 'desc' }, 
    take: 20
  });

  const settings = await prisma.leagueSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trade Center</h1>
          <p className="text-slate-500 mt-1">Review and respond to pending offers</p>
        </div>
        
        <Link 
          href="/trades/build"
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          + Propose Trade
        </Link>
      </div>

      {pendingTrades.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">🤝</div>
          <h3 className="text-lg font-bold text-slate-700">No Pending Trades</h3>
          <p className="text-slate-500 mt-2">Your negotiation table is currently empty.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingTrades.map((trade) => {
            const isInitiator = trade.initiatingTeamId === myTeamId;
            const initiatorName = trade.assets.find(a => a.fromTeamId === trade.initiatingTeamId)?.fromTeam.name 
              || trade.assets.find(a => a.toTeamId === trade.initiatingTeamId)?.toTeam.name 
              || 'Another Team';
            const userApproval = trade.approvals.find((a: any) => a.userId === userId);
            const hasApproved = userApproval?.status === 'APPROVED';
            const pendingApprovalsCount = trade.approvals.filter((a: any) => a.status === 'PENDING').length;

            // ⬅️ NEW: Group the assets by receiving team for a cleaner display
            const groupedAssets = trade.assets.reduce((acc: any, asset: any) => {
              const teamId = asset.toTeamId;
              if (!acc[teamId]) {
                acc[teamId] = { 
                  teamName: asset.toTeamNameSnapshot || asset.toTeam.name, 
                  items: [] 
                };
              }
              acc[teamId].items.push(asset);
              return acc;
            }, {});

            return (
              <div key={trade.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                      {isInitiator ? "Proposed by You" : `Offered by ${initiatorName}`}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400">
                    Proposed {new Date(trade.createdAt).toLocaleDateString()}
                    {trade.expiresAt && <span className="text-red-500 ml-2">(Expires {new Date(trade.expiresAt).toLocaleDateString()})</span>}
                  </div>
                </div>
                
                {/* Full-Width Stacked Rows */}
                <div className="flex flex-col gap-2 mb-6 flex-grow">
                  {Object.values(groupedAssets).map((group: any) => (
                    <div key={group.teamName} className="py-3 border-b border-slate-100 last:border-b-0">
                      <h4 className="font-bold text-sm text-slate-800 mb-2">
                        {group.teamName} Receives:
                      </h4>
                      <ul className="space-y-1.5">
                        {group.items.map((item: any, idx: number) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                            <span className="text-slate-300 text-sm">↳</span>
                            <span className="font-bold text-blue-600">
                              {item.player ? `${item.player.firstName} ${item.player.lastName}` : item.pickNameSnapshot}
                            </span>
                            <span className="text-xs text-slate-400 font-normal">
                              (from {item.fromTeamNameSnapshot || item.fromTeam.name})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* 🛡️ Dynamic Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                  <TradeActionButtons 
                    tradeId={trade.id} 
                    userId={userId}
                    teamId={myTeamId}
                    tradeAssets={trade.assets}
                    settings={settings}
                    isInitiator={isInitiator} 
                    status={trade.status}
                    hasApproved={hasApproved}
                    pendingApprovalsCount={pendingApprovalsCount}
                  />
                  
                  <Link 
                    href={`/trades/${trade.id}`} 
                    className="ml-auto text-sm text-blue-600 hover:underline font-bold"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecentTrades trades={processedTrades} myTeamId={myTeamId} />
    
    </div>
  );
}