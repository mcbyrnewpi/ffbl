// src/components/trades/RecentTrades.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  trades: any[];
  myTeamId: string;
}

export default function RecentTrades({ trades, myTeamId }: Props) {
  const [view, setView] = useState<'ALL' | 'MINE'>('ALL');

  const filteredTrades = view === 'ALL' 
    ? trades 
    : trades.filter(t => t.assets.some((a: any) => a.fromTeamId === myTeamId || a.toTeamId === myTeamId));

  return (
    <div className="mt-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Recent Transactions</h2>
          <p className="text-slate-500 mt-1">Completed trades across the league</p>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button
            onClick={() => setView('ALL')}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${
              view === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            League
          </button>
          <button
            onClick={() => setView('MINE')}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${
              view === 'MINE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            My Team
          </button>
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          No processed trades found for this view.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTrades.map(trade => (
            <div key={trade.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex-grow">
                <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Processed</span>
                  {new Date(trade.updatedAt).toLocaleDateString()}
                </div>
                
                <div className="flex flex-col gap-1.5">
                  {trade.assets.map((asset: any) => (
                    <div key={asset.id} className="text-sm flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">{asset.toTeam.name}</span>
                      <span className="text-slate-400">acquired</span>
                      <span className="font-bold text-blue-600">
                        {asset.player ? `${asset.player.firstName} ${asset.player.lastName}` : asset.pickNameSnapshot}
                      </span>
                      <span className="text-slate-400">from {asset.fromTeam.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link 
                href={`/trades/${trade.id}`} 
                className="whitespace-nowrap px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors text-center"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}