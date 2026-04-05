// src/components/teams/RosterView.tsx
"use client";

import { useState } from 'react';
import RosterTable from './RosterTable';
import PlayerCard from './PlayerCard';
import MlbLinkModal from './MLBLinkModal';
import PlayerCardModal from '../players/PlayerCardModal';

export default function RosterView({ title, players, headerColor, view, defaultOpen = true, isMyTeam }: any) {
  // State to track which player's warning icon was clicked
  const [playerToLink, setPlayerToLink] = useState<any | null>(null);
  
  // State to track which player's 3D card is being viewed
  const [selectedCardPlayer, setSelectedCardPlayer] = useState<any | null>(null);
  
  // State to track if the section is collapsed or open
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-4 relative">
      
      {/* Clickable Header with Chevron and Count */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 rounded-xl text-white ${headerColor} shadow-sm transition-opacity hover:opacity-95`}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black tracking-tight uppercase">{title}</h2>
          <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs font-bold">
            {players.length}
          </span>
        </div>
        
        <div className={`text-white text-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {/* Content is hidden when isOpen is false */}
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          {/* ⚡ This switches based on the GLOBAL prop */}
          {view === 'list' ? (
               <RosterTable 
                 title={title}
                 headerColor={headerColor}
                 players={players}
                 isMyTeam={isMyTeam}
                 onLinkClick={(player: any) => setPlayerToLink(player)} 
                 onNameClick={(player: any) => setSelectedCardPlayer(player)}
               />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
              {players.map((p: any) => (
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

      {/* Render the single linking modal for the entire view */}
      <MlbLinkModal 
        player={playerToLink} 
        isOpen={!!playerToLink} 
        onClose={() => setPlayerToLink(null)} 
      />

      {/* 🃏 THE 3D BASEBALL CARD MODAL */}
      <PlayerCardModal 
        isOpen={!!selectedCardPlayer}
        onClose={() => setSelectedCardPlayer(null)}
        player={selectedCardPlayer}
      />
    </div>
  );
}