import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function TradesDashboard() {
  const session = await getServerSession(authOptions);
  const myTeamId = (session?.user as any)?.teamId;

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
          // ⚾ Check if the logged-in user is the one who proposed this trade
            const isInitiator = trade.initiatingTeamId === myTeamId;
            const initiatorName = trade.assets.find(a => a.fromTeamId === trade.initiatingTeamId)?.fromTeam.name 
  || trade.assets.find(a => a.toTeamId === trade.initiatingTeamId)?.toTeam.name 
  || 'Another Team';

            return (
              <div key={trade.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{isInitiator ? "Proposed by You" : `Offered by ${initiatorName}`}</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    Proposed {new Date(trade.createdAt).toLocaleDateString()}
                    {trade.expiresAt && <span className="text-red-500 ml-2">(Expires {new Date(trade.expiresAt).toLocaleDateString()})</span>}
                  </div>
                </div>
                
                {/* Quick Summary of Assets */}
                <div className="flex flex-col gap-2 mb-6 flex-grow">
                  {trade.assets.map(asset => (
                    <div key={asset.id} className="text-sm flex items-center gap-2">
                      <span className="font-bold text-slate-700">{asset.toTeam.name}</span>
                      <span className="text-slate-400">receives</span>
                      <span className="font-medium text-blue-600">
                        {asset.player ? `${asset.player.firstName} ${asset.player.lastName}` : asset.pickNameSnapshot}
                      </span>
                      <span className="text-slate-400">from {asset.fromTeam.name}</span>
                    </div>
                  ))}
                </div>

                {/* 🛡️ Dynamic Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                  {isInitiator ? (
                    <button className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-lg transition-colors">
                      Cancel Trade
                    </button>
                  ) : (
                    <>
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors">
                        Approve Deal
                      </button>
                      <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">
                        Counter Offer
                      </button>
                      <button className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-lg transition-colors">
                        Decline
                      </button>
                    </>
                  )}
                  
                  {/* 🔗 Link to the detailed summary page */}
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
    </div>
  );
}