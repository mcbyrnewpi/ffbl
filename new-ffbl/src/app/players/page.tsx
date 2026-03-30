// src/app/players/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// --- THE HEADSHOT COMPONENT ---
const PlayerHeadshot = ({ player }: { player: any }) => {
  // Store the initial image source in React state
  const initialSrc = player.mlbId 
    ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_120/v1/people/${player.mlbId}/headshot/silo/current.png`
    : '/images/placeholders/no-player.svg';

  const [imgSrc, setImgSrc] = useState(initialSrc);

  return (
    <div className="w-16 h-16 bg-slate-100 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 mr-4 relative">
      <img 
        src={imgSrc}
        alt={player.lastName || "Player"}
        className="w-full h-full object-cover"
        onError={() => {
          // Force React to cleanly re-render with the local fallback
          setImgSrc('/images/placeholders/no-player.svg');
        }} 
      />
    </div>
  );
};

// --- THE MAIN SEARCH CONTENT ---
function PlayerSearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('name') || '';
  const initialSearchMlb = searchParams.get('searchMlb') === 'true';

  const [query, setQuery] = useState(initialQuery);
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearchedMlb, setHasSearchedMlb] = useState(initialSearchMlb);

  // Function to call our Omni-Search API
  const searchPlayers = async (searchMlb = false, searchQuery = query) => {
    if (searchQuery.length < 3) return;
    
    setIsLoading(true);
    try {
      const url = `/api/players?name=${encodeURIComponent(searchQuery)}${searchMlb ? '&searchMlb=true' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsLoading(false);
      if (searchMlb) setHasSearchedMlb(true);
    }
  };

  // 1. Handle URL Parameters on First Load
  useEffect(() => {
    if (initialQuery && initialSearchMlb) {
      searchPlayers(true, initialQuery);
    }
  }, [initialQuery, initialSearchMlb]);

  // 2. Auto-search local DB as you type (debounced)
  useEffect(() => {
    // Prevent the auto-search from overriding the initial URL load
    if (query === initialQuery && initialSearchMlb && players.length === 0 && isLoading) return;

    setHasSearchedMlb(false);
    const timeoutId = setTimeout(() => {
      if (query.length >= 3) {
        searchPlayers(false, query); 
      } else {
        setPlayers([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handler for importing a new player
  const handleImportPlayer = async (externalPlayer: any) => {
    // We will build the POST route for this next!
    alert(`Ready to import ${externalPlayer.firstName} ${externalPlayer.lastName}! We need to build the POST route next.`);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Player Database</h1>
        <p className="text-slate-500">Search for active roster players, prospects, or import new rookies.</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-4 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-lg transition-shadow"
          placeholder="Search for a player (e.g., 'Shohei', 'Cespedes')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <div 
            key={player.id} 
            className={`flex items-center p-4 rounded-xl border ${player.isExternal ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm'}`}
          >
            {/* High-Res MLB Headshot with Fallback */}
            <PlayerHeadshot player={player} />

            {/* Player Info */}
            <div className="flex-grow min-w-0">
              <h3 className="text-lg font-bold text-slate-900 truncate flex items-center gap-2">
                {player.firstName} {player.lastName}
                
                {/* Cloud icon for players not in DB */}
                {player.isExternal && (
                  <span 
                    className="inline-flex items-center justify-center bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex-shrink-0"
                    title="External MLB Player (Not in local DB)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  </span>
                )}
              </h3>
              
              {player.isExternal ? (
                // Detailed info for external MLB players
                <div className="flex flex-col gap-1 mt-1">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    MLB API Match
                  </div>
                  <div className="text-sm text-slate-600 truncate flex items-center">
                    <span className="font-bold text-slate-800">
                      {player.mlbRawData?.primaryPosition?.abbreviation || '??'}
                    </span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="truncate">
                      {player.mlbRawData?.currentTeam?.name || 'No Current MLB Affiliate'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    DOB: {player.mlbRawData?.birthDate ? new Date(player.mlbRawData.birthDate).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              ) : (
                // Standard info for local FFBL players
                <div className="text-sm text-slate-500 truncate mt-1">
                  {player.team ? (
                    <span className="font-medium text-slate-700">{player.team.name}</span>
                  ) : (
                    <span className="font-medium text-emerald-600">Free Agent</span>
                  )}
                  <span className="mx-2">•</span>
                  {player.status}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="ml-2 flex-shrink-0">
              {player.isExternal ? (
                <button 
                  onClick={() => handleImportPlayer(player)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition-colors"
                >
                  Import
                </button>
              ) : (
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg border border-slate-200 transition-colors">
                  View
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600"></div>
          <p className="mt-2 text-slate-500 font-medium">Scouting players...</p>
        </div>
      )}

      {/* "Don't see them?" Progressive Disclosure Button */}
      {!isLoading && query.length >= 3 && !hasSearchedMlb && (
        <div className="mt-8 text-center bg-slate-50 border border-slate-200 rounded-xl p-6">
          <p className="text-slate-600 mb-3">Can't find the player you're looking for in the FFBL database?</p>
          <button 
            onClick={() => searchPlayers(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-300 shadow-sm transition-all"
          >
            Search MLB Database
          </button>
        </div>
      )}
      
      {/* No Results Fallback */}
      {!isLoading && query.length >= 3 && players.length === 0 && hasSearchedMlb && (
        <div className="text-center py-12 text-slate-500">
          No players found in the local or MLB databases matching "{query}".
        </div>
      )}
    </div>
  );
}

// Wrap in Suspense because we use useSearchParams() in Next.js 15
export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading search...</div>}>
      <PlayerSearchContent />
    </Suspense>
  );
}