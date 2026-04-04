// src/app/players/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MILB_PARENT_MAP } from '@/lib/milb-map'; 
import AddPlayerMenu from '@/components/players/AddPlayerMenu'; // ⬅️ NEW IMPORT

// --- THE HEADSHOT COMPONENT ---
const PlayerHeadshot = ({ player }: { player: any }) => {
  const initialSrc = player.mlbId 
    ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_120/v1/people/${player.mlbId}/headshot/silo/current.png`
    : '/images/placeholders/no-player.svg';

  const [imgSrc, setImgSrc] = useState(initialSrc);

  return (
    <div className="w-16 h-16 bg-slate-100 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 mr-4 relative shadow-sm">
      <img 
        src={imgSrc}
        alt={player.lastName || "Player"}
        className="w-full h-full object-cover"
        onError={() => {
          setImgSrc('/images/placeholders/no-player.svg');
        }} 
      />
    </div>
  );
};

// --- THE MAIN SEARCH CONTENT ---
function PlayerSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const myTeamId = (session?.user as any)?.teamId;

  const initialQuery = searchParams.get('name') || '';
  const initialSearchMlb = searchParams.get('searchMlb') === 'true';

  const [query, setQuery] = useState(initialQuery);
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearchedMlb, setHasSearchedMlb] = useState(initialSearchMlb);
  
  const [importingId, setImportingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

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

  useEffect(() => {
    if (initialQuery && initialSearchMlb) {
      searchPlayers(true, initialQuery);
    }
  }, [initialQuery, initialSearchMlb]);

  useEffect(() => {
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

  const handleImportPlayer = async (externalPlayer: any) => {
    setImportingId(externalPlayer.id);
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mlbId: externalPlayer.mlbId,
          firstName: externalPlayer.firstName,
          lastName: externalPlayer.lastName,
        }),
      });

      if (res.ok) {
        searchPlayers(hasSearchedMlb, query);
      } else {
        const error = await res.json();
        alert(`Import failed: ${error.error || error.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred during import.");
    } finally {
      setImportingId(null);
    }
  };

  const handleAddToRoster = async (player: any, targetLevel: string) => {
    if (!myTeamId) return alert("You must be assigned to a team to add players.");
    
    setAddingId(player.id);
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamId: myTeamId, 
          status: 'ACTIVE', 
          level: targetLevel 
        }),
      });

      if (res.ok) {
        searchPlayers(hasSearchedMlb, query);
        alert(`${player.firstName} ${player.lastName} added to your ${targetLevel} Roster!`);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to add player.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setAddingId(null);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Player Database</h1>
        <p className="text-slate-500">Search for active roster players, prospects, or import new rookies.</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-lg transition-shadow"
          placeholder="Search for a player (e.g., 'Shohei', 'Cespedes')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {players.map((player) => (
          <div 
            key={player.id} 
            className={`flex flex-col p-5 rounded-xl border ${player.isExternal ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'} transition-all relative hover:z-50 focus-within:z-50`}
          >
            <div className="flex items-start">
              <PlayerHeadshot player={player} />

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900 truncate">
                    {player.firstName} {player.lastName}
                  </h3>
                  {player.isExternal && (
                    <span className="inline-flex items-center justify-center bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex-shrink-0" title="External MLB Player">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <span className="font-bold text-slate-700">
                    {player.isExternal 
                      ? player.mlbRawData?.primaryPosition?.abbreviation 
                      : player.positions?.[0]?.abbrev || '??'}
                  </span>
                  <span>•</span>
                  <span className={player.team?.name ? "text-blue-600 font-semibold" : "text-emerald-600 font-medium"}>
                    {player.isExternal ? 'Not in FFBL' : (player.team?.name || 'Free Agent')}
                  </span>
                </div>

                {player.mlbRawData?.currentTeam?.name && (
                  <div className="text-sm text-slate-600 mb-1.5 truncate">
                    <span className="font-medium">
                      {player.mlbRawData.currentTeam.name}
                    </span>
                    {player.mlbRawData?.currentTeam?.id && MILB_PARENT_MAP[player.mlbRawData.currentTeam.id] && (
                      <span className="font-bold text-slate-400 ml-1">
                        ({MILB_PARENT_MAP[player.mlbRawData.currentTeam.id].parentAbbrev})
                      </span>
                    )}
                  </div>
                )}

                <div className="text-xs text-slate-400 uppercase font-medium tracking-wide">
                  Born: {formatDate(player.isExternal ? player.mlbRawData?.birthDate : (player.birthdate || player.dob))}
                </div>
              </div>
            </div>

            {/* Action Buttons Container */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              {player.isExternal ? (
                <button 
                  onClick={() => handleImportPlayer(player)}
                  disabled={importingId === player.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {importingId === player.id ? (
                    <><span className="animate-spin text-lg leading-none">⚾</span> Importing...</>
                  ) : (
                    'Import to FFBL'
                  )}
                </button>
              ) : (
                <div className="flex gap-2 w-full">
                  
                  {/* The cleanly imported AddPlayerMenu component */}
                  {!player.teamId && myTeamId && (
                    <AddPlayerMenu 
                      isAdding={addingId === player.id}
                      onAdd={(level) => handleAddToRoster(player, level)}
                    />
                  )}

                  {/* Deep-Link Trade Button */}
                  {player.teamId && player.teamId !== myTeamId && myTeamId && !player.isTradeLocked && (
                    <button 
                      onClick={() => router.push(`/trades/build?addPlayer=${player.id}`)}
                      className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors"
                    >
                      Propose Trade
                    </button>
                  )}

                  {/* View Profile Button */}
                  <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-lg border border-slate-200 transition-colors">
                    View Profile
                  </button>
                </div>
              )}
            </div>
            
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600"></div>
          <p className="mt-3 text-slate-500 font-medium">Scouting players...</p>
        </div>
      )}

      {!isLoading && query.length >= 3 && !hasSearchedMlb && (
        <div className="mt-12 text-center bg-slate-50 border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto">
          <p className="text-slate-600 mb-4 text-lg">Can't find the player you're looking for?</p>
          <button 
            onClick={() => searchPlayers(true)}
            className="bg-white hover:bg-slate-50 text-blue-600 font-bold py-3 px-8 rounded-lg border border-slate-300 shadow-sm transition-all"
          >
            Search MLB Database
          </button>
        </div>
      )}
      
      {!isLoading && query.length >= 3 && players.length === 0 && hasSearchedMlb && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-4">🤷‍♂️</div>
          <p className="text-lg">No players found matching "{query}".</p>
          <p className="text-sm mt-2 text-slate-400">Check your spelling or try searching by last name only.</p>
        </div>
      )}
    </div>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading search...</div>}>
      <PlayerSearchContent />
    </Suspense>
  );
}