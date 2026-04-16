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
  
  // Determine if the trade deadline has passed
  const isDeadlinePassed = settings?.tradeDeadline ? new Date() > settings.tradeDeadline : false;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trade Center</h1>
          <p className="text-slate-500 mt-1 font-medium">Review and respond to pending offers</p>
        </div>
        
        {/* Conditionally render the Propose Trade button based on the deadline */}
        {isDeadlinePassed ? (
          <div 
            className="w-full sm:w-auto px-6 py-4 sm:py-3 bg-slate-200 text-slate-400 font-black rounded-xl sm:rounded-lg shadow-inner text-center flex-shrink-0 cursor-not-allowed border border-slate-300"
            title="The FFBL trade deadline has passed"
          >
            Deadline Passed
          </div>
        ) : (
          <Link 
            href="/trades/build"
            className="w-full sm:w-auto px-6 py-4 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl sm:rounded-lg shadow-sm shadow-blue-500/25 transition-all text-center flex-shrink-0"
          >
            Propose Trade
          </Link>
        )}
      </div>

      {pendingTrades.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">🤝</div>
          <h3 className="text-lg font-bold text-slate-700">No Pending Trades</h3>
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

            // Group the assets by receiving team for a cleaner display
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
              <div key={trade.id} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col">
                
                {/* THE HEADER (Stacks on mobile, removes rogue margins, aligns left) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] sm:text-xs">
                      {isInitiator ? "Proposed by You" : `Offered by ${initiatorName}`}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 font-medium">
                    Proposed {new Date(trade.createdAt).toLocaleDateString()}
                    {trade.expiresAt && <span className="text-red-500 ml-1 block sm:inline-block mt-1 sm:mt-0">(Expires {new Date(trade.expiresAt).toLocaleDateString()})</span>}
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

                {/* THE FOOTER (Stacks buttons, makes "View Details" a full-width mobile button) */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-auto pt-4 border-t border-slate-100">
                  
                  <Link 
                    href={`/trades/${trade.id}`} 
                    className="w-full sm:w-auto text-center sm:text-left text-sm text-blue-600 hover:text-blue-800 font-bold bg-blue-50 sm:bg-transparent py-3 sm:py-0 rounded-lg sm:rounded-none transition-colors"
                  >
                    View Details &rarr;
                  </Link>
                  
                  <div className="w-full sm:w-auto flex justify-center sm:justify-end">
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
                      isDeadlinePassed={isDeadlinePassed} // Pass it down if we need it there too!
                    />
                  </div>

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