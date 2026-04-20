// src/components/dashboard/RecentTransactionsWidget.tsx
import { prisma } from '@/lib/prisma';
import { Activity, ArrowRightLeft, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

export default async function RecentTransactionsWidget() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { player: true, team: true }
  });

  const getIcon = (type: string) => {
    if (type === 'ADD' || type === 'PROMOTE' || type.includes('ACTIVATE')) return <Plus size={14} className="text-emerald-500" />;
    if (type === 'DROP' || type === 'DEMOTE' || type.includes('PLACE')) return <Minus size={14} className="text-red-500" />;
    if (type === 'TRADE') return <ArrowRightLeft size={14} className="text-blue-500" />;
    return <Activity size={14} className="text-slate-500" />;
  };

  const renderTransactionText = (tx: any) => {
    const teamName = tx.team?.name || 'League';
    const playerName = tx.player ? `${tx.player.firstName} ${tx.player.lastName}` : null;

    let actionText = tx.details;

    // If there are no custom details in the DB, gracefully fall back to a generic description
    if (!actionText) {
       switch (tx.type) {
        case 'ADD': actionText = `Added to active roster`; break;
        case 'DROP': actionText = `Dropped from roster`; break;
        case 'PROMOTE': actionText = `Promoted to higher level`; break;
        case 'DEMOTE': actionText = `Demoted to lower level`; break;
        case 'PLACE_ON_IL': actionText = `Placed on the Injured List`; break;
        case 'ACTIVATE_FROM_IL': actionText = `Activated from the Injured List`; break;
        case 'PLACE_ON_IL_60': actionText = `Placed on the 60-Day IL`; break;
        case 'ACTIVATE_FROM_IL_60': actionText = `Activated from the 60-Day IL`; break;
        case 'PLACE_ON_NA': actionText = `Placed on the NA list`; break;
        case 'ACTIVATE_FROM_NA': actionText = `Activated from the NA list`; break;
        case 'DRAFT': actionText = `Drafted`; break;
        case 'TRADE': actionText = `Acquired via trade`; break;
        default: actionText = tx.type.toLowerCase().replace(/_/g, ' ');
      }
    }

    return (
      <div className="flex flex-col">
        {/* Top Line: Strictly enforced Team & Player names */}
        <div className="font-bold text-slate-900 text-sm leading-tight">
          {teamName} 
          {playerName && <span className="text-slate-400 font-normal mx-1.5">•</span>} 
          {playerName && <span className="text-slate-700">{playerName}</span>}
        </div>
        {/* Bottom Line: The action or details string */}
        <div className="text-slate-500 text-xs mt-0.5 font-medium leading-snug">
          {actionText}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-blue-600" />
          <h2 className="font-black text-slate-900 uppercase tracking-tight">Recent Transactions</h2>
        </div>
        <Link href="/transactions" className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
          View All
        </Link>
      </div>
      
      <div className="p-0 flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm font-bold italic">No recent activity.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {transactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md border border-slate-200 shrink-0">
                  {getIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  
                  {renderTransactionText(tx)}

                  <p className="text-[9px] font-black text-slate-400/80 uppercase tracking-widest mt-2">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}