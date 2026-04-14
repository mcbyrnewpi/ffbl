"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRightLeft } from 'lucide-react';

type FilterType = 'ALL' | 'ADD' | 'DROP' | 'TRADE' | 'PROMOTE' | 'DEMOTE' | 'PLACE_ON_IL' | 'PLACE_ON_IL_60' | 'DRAFT';

interface UnifiedTransaction {
  id: string;
  date: string;
  type: string;
  playerName: string;
  mlbId: number | null;
  teamName: string;
  details: string | null;
  tradeId: string | null;
  era: 'MODERN' | 'LEGACY';
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'TRADE', label: 'Trades' },
  { value: 'ADD', label: 'Adds' },
  { value: 'DROP', label: 'Drops' },
  { value: 'PROMOTE', label: 'Promotions' },
  { value: 'DEMOTE', label: 'Demotions' },
  { value: 'PLACE_ON_IL', label: 'IL' },
  { value: 'PLACE_ON_IL_60', label: '60 Day IL' },
  { value: 'DRAFT', label: 'Drafted' },
];

export default function TransactionWire({ teamId }: { teamId?: string }) {
  const searchParams = useSearchParams();
  const urlPlayerId = searchParams.get('playerId');

  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // The Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // The Fetcher
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        let url = `/api/transactions?limit=50`;
        if (teamId) url += `&teamId=${teamId}`;
        if (urlPlayerId) url += `&playerId=${urlPlayerId}`;
        if (filterType !== 'ALL') url += `&type=${filterType}`;
        if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTransactions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [debouncedSearch, filterType, teamId]);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'ADD': return 'border-emerald-500 bg-emerald-50 text-emerald-900';
      case 'DROP': return 'border-red-500 bg-red-50 text-red-900';
      case 'TRADE': return 'border-blue-500 bg-blue-50 text-blue-900';
      case 'PROMOTE': 
      case 'DEMOTE': return 'border-amber-500 bg-amber-50 text-amber-900';
      case 'PLACE_ON_IL':
      case 'PLACE_ON_IL_60': return 'border-purple-500 bg-purple-50 text-purple-900';
      case 'DRAFT': return 'border-yellow-400 bg-yellow-50 text-yellow-900';
      default: return 'border-slate-300 bg-slate-50 text-slate-900';
    }
  };

  return (
    <div className="flex flex-col w-full">
      
      {/* --- THE FILTERS CARD (Matches Players Page exactly) --- */}
      <div className="flex flex-col gap-5 mb-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
            Filter by Transaction
          </span>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => {
              const isActive = filterType === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setFilterType(option.value)}
                  className={`px-5 py-1.5 text-sm font-bold rounded-full border transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- THE SEARCH BAR --- */}
      <div className="relative mb-8 shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search for a specific player (e.g., 'Judge', 'Willits')..."
          className="block w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl leading-5 bg-white text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-lg transition-shadow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* --- THE WIRE FEED --- */}
      <div className="flex flex-col space-y-4">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600"></div>
            <p className="mt-3 text-slate-500 font-medium">Loading wire...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="text-4xl mb-4">📜</div>
            <p className="text-lg">No transactions found.</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div 
              key={tx.id} 
              className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 rounded-xl shadow-sm border-l-4 border-y border-r ${getTypeStyles(tx.type)} bg-white hover:shadow-md transition-shadow`}
            >
              
              {/* Date & Type Badge */}
              <div className="flex flex-col shrink-0 w-32">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                  {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-sm font-bold mt-1">
                  {tx.type.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Core Details */}
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">
                    {tx.mlbId ? (
                      <Link href={`/players/${tx.mlbId}`} className="hover:underline hover:text-blue-600">
                        {tx.playerName}
                      </Link>
                    ) : (
                      <span>{tx.playerName}</span>
                    )}
                  </span>
                  {tx.era === 'LEGACY' && (
                    <span className="inline-flex items-center justify-center bg-slate-200 text-slate-600 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider flex-shrink-0">
                      ARCHIVE
                    </span>
                  )}
                </div>
                
                <div className="text-sm mt-1 opacity-90">
                  <span className="font-semibold">{tx.teamName}</span>
                  {tx.details && (
                    <span className="ml-2 text-slate-600">— {tx.details}</span>
                  )}
                </div>

                {tx.tradeId && (
                  <div className="mt-3">
                    <Link 
                      href={`/trades/${tx.tradeId}`} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm group"
                    >
                      <ArrowRightLeft size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                      View Trade Summary
                    </Link>
                  </div>
                )}

              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}