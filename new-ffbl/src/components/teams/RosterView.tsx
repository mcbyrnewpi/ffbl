// src/components/teams/RosterView.tsx
"use client";

import { useState } from 'react';
import RosterTable from './RosterTable';
import PlayerCard from './PlayerCard';
import MlbLinkModal from './MLBLinkModal';

export default function RosterView({ title, players, headerColor, view }: any) {
  // State to track which player's warning icon was clicked
  const [playerToLink, setPlayerToLink] = useState<any | null>(null);

  return (
    <div className="space-y-4 relative">
      <div className={`p-4 rounded-xl text-white ${headerColor} shadow-sm`}>
        <h2 className="text-lg font-black tracking-tight uppercase">{title}</h2>
      </div>

      {/* ⚡ This switches based on the GLOBAL prop */}
      {view === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <RosterTable 
             title={title}
             headerColor={headerColor}
             players={players} 
             onLinkClick={(player: any) => setPlayerToLink(player)} 
           />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {players.map((p: any) => (
            <PlayerCard 
              key={p.id} 
              player={p} 
              onLinkClick={() => setPlayerToLink(p)} 
            />
          ))}
        </div>
      )}

      {/* Render the single modal for the entire view */}
      <MlbLinkModal 
        player={playerToLink} 
        isOpen={!!playerToLink} 
        onClose={() => setPlayerToLink(null)} 
      />
    </div>
  );
}