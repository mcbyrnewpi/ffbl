// src/components/teams/RosterView.tsx
"use client";

import { useState } from 'react';
import RosterTable from './RosterTable';
import PlayerCard from './PlayerCard';
import MlbLinkModal from './MLBLinkModal';
import PlayerCardModal from '../players/PlayerCardModal';

const POSITION_ORDER: Record<string, number> = {
  'C': 1, '1B': 2, '2B': 3, '3B': 4, 'SS': 5, 
  'LF': 6, 'CF': 7, 'RF': 8, 'OF': 9, 'DH': 10, 'UTIL': 11,
  'SP': 12, 'RP': 13, 'P': 14, 'TWP': 15
};

export default function RosterView({ title, players, headerColor, view, defaultOpen = true, isMyTeam }: any) {
  const [playerToLink, setPlayerToLink] = useState<any | null>(null);
  const [selectedCardPlayer, setSelectedCardPlayer] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const sortedPlayers = [...players].sort((a, b) => {
    const posA = a.positions?.[0]?.abbrev || a.mlbRawData?.primaryPosition?.abbreviation || 'ZZ';
    const posB = b.positions?.[0]?.abbrev || b.mlbRawData?.primaryPosition?.abbreviation || 'ZZ';
    
    const weightA = POSITION_ORDER[posA] || 99;
    const weightB = POSITION_ORDER[posB] || 99;
    
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return (a.lastName || '').localeCompare(b.lastName || '');
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col transition-all relative focus-within:z-10">
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 md:px-6 py-4 bg-slate-50 transition-colors hover:bg-slate-100 ${isOpen ? 'rounded-t-xl border-b border-slate-200' : 'rounded-xl'}`}
      >
        <div className="flex items-center gap-3">
          <h2 className={`text-sm md:text-base font-black tracking-widest uppercase ${headerColor}`}>{title}</h2>
          <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-black shadow-sm">
            {sortedPlayers.length}
          </span>
        </div>
        
        <div className={`text-slate-400 text-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-white rounded-b-xl">
          {view === 'list' ? (
               <RosterTable 
                 players={sortedPlayers} 
                 isMyTeam={isMyTeam}
                 onLinkClick={(player: any) => setPlayerToLink(player)} 
                 onNameClick={(player: any) => setSelectedCardPlayer(player)}
               />
          ) : (
            <div className="p-4 md:p-6 bg-slate-50/50 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 rounded-b-xl">
              {sortedPlayers.map((p: any) => (
                <PlayerCard 
                  key={p.id} 
                  player={p}
                  isMyTeam={isMyTeam}
                  onLinkClick={() => setPlayerToLink(p)} 
                  onNameClick={() => setSelectedCardPlayer(p)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <MlbLinkModal player={playerToLink} isOpen={!!playerToLink} onClose={() => setPlayerToLink(null)} />
      <PlayerCardModal isOpen={!!selectedCardPlayer} onClose={() => setSelectedCardPlayer(null)} player={selectedCardPlayer} />
    </div>
  );
}