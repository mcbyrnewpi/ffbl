// src/app/players/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MILB_PARENT_MAP } from '@/lib/milb-map'; 
import AddPlayerMenu from '@/components/players/AddPlayerMenu';
import PlayerCardModal from '@/components/players/PlayerCardModal';
import { Trophy } from 'lucide-react'; 

// --- THE HEADSHOT COMPONENT ---
const PlayerHeadshot = ({ player }: { player: any }) => {
  const initialSrc = player.mlbId 
    ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_120/v1/people/${player.mlbId}/headshot/silo/current.png`
    : '/images/placeholders/no-player.svg';

  const [imgSrc, setImgSrc] = useState(initialSrc);
  const isRetired = player.status === 'RETIRED'; 

  return (
    <div className={`w-16 h-16 bg-slate-100 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 mr-4 relative shadow-sm transition-all duration-300 ${isRetired ? 'grayscale opacity-75' : ''}`}>
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

const POSITIONS = ['ALL', 'C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP'];

// --- 🌟 LEGACY TEAM CALCULATOR ---
const getLegacyTeam = (player: any) => {
  if (!player.mlbRawData?.stats) return player.mlbRawData?.currentTeam?.name || 'Retired';

  const teamTallies: Record<string, number> = {};
  
  const ybyStats = player.mlbRawData.stats.filter(
    (s: any) => s.type?.displayName === 'yearByYear'
  );

  ybyStats.forEach((statBlock: any) => {
    if (statBlock.splits) {
      statBlock.splits.forEach((split: any) => {
        if (split.team && split.team.name && !split.team.name.includes("All-Star")) {
          teamTallies[split.team.name] = (teamTallies[split.team.name] || 0) + 1;
        }
      });
    }
  });

  const teams = Object.keys(teamTallies);
  if (teams.length === 0) return player.mlbRawData?.currentTeam?.name || 'Retired';

  return teams.reduce((a, b) => teamTallies[a] > teamTallies[b] ? a : b);
};


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
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  const [ownershipFilter, setOwnershipFilter] = useState<'ALL' | 'FA'>('ALL');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'RETIRED' | 'ALL'>('ACTIVE');

  const searchPlayers = async (
    searchMlb = false, 
    searchQuery = query, 
    ownership = ownershipFilter, 
    position = positionFilter,
    status = statusFilter
  ) => {
    if (searchMlb && searchQuery.length < 3) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.length >= 3) params.append('name', searchQuery);
      if (searchMlb) params.append('searchMlb', 'true');
      if (ownership === 'FA') params.append('unowned', 'true');
      if (position !== 'ALL') params.append('position', position);
      if (status !== 'ALL') params.append('status', status);

      const url = `/api/players?${params.toString()}`;
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
    searchPlayers(initialSearchMlb, initialQuery, ownershipFilter, positionFilter, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    setHasSearchedMlb(false);
    const timeoutId = setTimeout(() => {
      searchPlayers(false, query, ownershipFilter, positionFilter, statusFilter); 
    }, 400);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ownershipFilter, positionFilter, statusFilter]);

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
          status: externalPlayer.status 
        }),
      });

      if (res.ok) {
        searchPlayers(hasSearchedMlb, query, ownershipFilter, positionFilter, statusFilter);
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
          status: player.status === 'RETIRED' ? 'RETIRED' : 'ACTIVE', 
          level: targetLevel 
        }),
      });

      if (res.ok) {
        searchPlayers(hasSearchedMlb, query, ownershipFilter, positionFilter, statusFilter);
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
        <p className="text-slate-500">Browse the waiver wire, find prospects, or search the MLB for new rookies.</p>
      </div>

      {/* 🌟 NEW CLEAN FILTERS UI */}
      <div className="flex flex-col gap-5 mb-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        
        {/* Top Row: Primary Toggles */}
        <div className="flex flex-col sm:flex-row gap-6">
          
          {/* Status Toggle */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Player Status</span>
            <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-max">
              <button onClick={() => setStatusFilter('ACTIVE')} className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold rounded-md transition-all ${statusFilter === 'ACTIVE' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Active</button>
              <button onClick={() => setStatusFilter('RETIRED')} className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold rounded-md transition-all ${statusFilter === 'RETIRED' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}>Retired</button>
              <button onClick={() => setStatusFilter('ALL')} className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold rounded-md transition-all ${statusFilter === 'ALL' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
            </div>
          </div>

          {/* Ownership Toggle */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Availability</span>
            <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-max">
              <button onClick={() => setOwnershipFilter('ALL')} className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold rounded-md transition-all ${ownershipFilter === 'ALL' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>All Teams</button>
              <button onClick={() => setOwnershipFilter('FA')} className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold rounded-md transition-all ${ownershipFilter === 'FA' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>Free Agents</button>
            </div>
          </div>

        </div>

        <div className="h-px w-full bg-slate-100"></div>

        {/* Bottom Row: Position Pills */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Filter by Position</span>
          <div className="flex flex-wrap gap-2 w-full">
            {POSITIONS.map(pos => (
              <button 
                key={pos} 
                onClick={() => setPositionFilter(pos)} 
                className={`px-5 py-1.5 text-sm font-bold rounded-full border transition-colors whitespace-nowrap ${
                  positionFilter === pos 
                    ? 'bg-slate-800 text-white border-slate-800' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

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
          placeholder="Search for a specific player (e.g., 'Pujols', 'Votto')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {players.map((player) => (
          <div 
            key={player.id} 
            className={`flex flex-col p-5 rounded-xl border ${
              player.status === 'RETIRED' 
                ? 'bg-slate-50 border-slate-200 shadow-sm opacity-90' 
                : player.isExternal 
                  ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
            } transition-all relative hover:z-50 focus-within:z-50`}
          >
            <div 
              className="flex items-start cursor-pointer group/header"
              onClick={() => setSelectedPlayer(player)}
            >
              <div className="group-hover/header:scale-105 transition-transform duration-300">
                <PlayerHeadshot player={player} />
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-lg font-bold truncate transition-colors ${player.status === 'RETIRED' ? 'text-slate-700' : 'text-slate-900 group-hover/header:text-blue-600'}`}>
                    {player.firstName} {player.lastName}
                  </h3>
                  {player.status === 'RETIRED' && (
                    <span className="inline-flex items-center justify-center bg-slate-200 text-slate-600 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider flex-shrink-0" title="Retired Player">
                      Retired
                    </span>
                  )}
                  {player.isExternal && player.status !== 'RETIRED' && (
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
                  
                  {player.status === 'RETIRED' ? (
                     <span className="text-slate-500 font-medium italic">
                       {getLegacyTeam(player)}
                     </span>
                  ) : (
                    <span className={player.team?.name ? "text-blue-600 font-semibold" : "text-emerald-600 font-medium"}>
                      {player.isExternal ? 'Not in FFBL' : (player.team?.name || 'Free Agent')}
                    </span>
                  )}
                </div>

                {player.mlbRawData?.currentTeam?.name && player.status !== 'RETIRED' && (
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
            <div className="mt-4 pt-4 border-t border-slate-200">
              {player.isExternal ? (
                <button 
                  onClick={() => handleImportPlayer(player)}
                  disabled={importingId === player.id}
                  className={`w-full text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 ${
                    player.status === 'RETIRED' 
                      ? 'bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400' 
                      : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                  }`}
                >
                  {importingId === player.id ? (
                    <><span className="animate-spin text-lg leading-none">⚾</span> Importing...</>
                  ) : player.status === 'RETIRED' ? (
                    'Import to Alumni Database'
                  ) : (
                    'Import to FFBL'
                  )}
                </button>
              ) : player.status === 'RETIRED' ? (
                
                <div className="flex gap-2 w-full">
                  {myTeamId && (
                    <button 
                      onClick={() => alert("HOF Induction Flow Coming Soon!")}
                      className="flex-1 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Trophy size={16} />
                      Induct to HOF
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedPlayer(player)}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-lg border border-slate-300 transition-colors"
                  >
                    View Profile
                  </button>
                </div>

              ) : (
                <div className="flex gap-2 w-full">
                  {!player.teamId && myTeamId && (
                    <AddPlayerMenu 
                      isAdding={addingId === player.id}
                      onAdd={(level) => handleAddToRoster(player, level)}
                    />
                  )}

                  {player.teamId && player.teamId !== myTeamId && myTeamId && !player.isTradeLocked && (
                    <button 
                      onClick={() => router.push(`/trades/build?addPlayer=${player.id}`)}
                      className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors"
                    >
                      Propose Trade
                    </button>
                  )}

                  <button 
                    onClick={() => setSelectedPlayer(player)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-lg border border-slate-200 transition-colors"
                  >
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
      
      {!isLoading && players.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-4">🤷‍♂️</div>
          <p className="text-lg">No players found matching your current filters.</p>
          <p className="text-sm mt-2 text-slate-400">Try adjusting your position, status, or ownership toggles.</p>
        </div>
      )}

      <PlayerCardModal 
        isOpen={!!selectedPlayer} 
        onClose={() => setSelectedPlayer(null)} 
        player={selectedPlayer} 
      />
    </div>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading database...</div>}>
      <PlayerSearchContent />
    </Suspense>
  );
}