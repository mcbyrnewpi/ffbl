// src/components/teams/PlayerCard.tsx
import PlayerHeadshot from './PlayerHeadshot';
import { AlertTriangle, Trophy } from 'lucide-react';
import PlayerActionMenu from './PlayerActionMenu';

interface PlayerCardProps {
  player: any;
  onLinkClick?: () => void;
  onNameClick?: () => void; 
  isMyTeam?: boolean;
}

export default function PlayerCard({ player, onLinkClick, onNameClick, isMyTeam }: PlayerCardProps) {
  return (

    <div className="bg-white rounded-xl shadow-sm border border-slate-200 group relative flex flex-col hover:shadow-md transition-all hover:z-50 focus-within:z-50">
      
      {/* 1. TOP OVERLAYS */}
      <div className="absolute top-2 inset-x-2 flex justify-between items-start z-30 pointer-events-none">
        {player.status !== 'ACTIVE' ? (
          <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
            {player.status}
          </span>
        ) : <div />}

        {!player.mlbId && onLinkClick && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLinkClick();
            }}
            className="pointer-events-auto text-amber-500 hover:text-amber-600 hover:bg-amber-50 p-1.5 rounded-full transition-colors shadow-md border border-amber-200 bg-white"
            title="Link MLB Profile"
          >
            <AlertTriangle size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* 2. CLICKABLE HEADSHOT AREA (Now handles its own overflow) */}
      <button 
        onClick={onNameClick}
        className="relative h-36 overflow-hidden bg-slate-100 flex flex-col items-center flex-shrink-0 w-full group/img focus:outline-none rounded-t-xl"
      >
        <PlayerHeadshot 
          player={player} 
          className="group-hover/img:scale-105 transition-transform duration-500" 
        />

        {player.isTop100 && player.prospectRank && (
          <div className="absolute bottom-1.5 z-10 animate-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-md border border-emerald-300 flex items-center gap-1">
              <Trophy size={10} className="text-emerald-100" />
              #{player.prospectRank}
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-blue-600/0 group-hover/img:bg-blue-600/5 transition-colors flex items-center justify-center">
             <span className="opacity-0 group-hover/img:opacity-100 bg-white/90 text-blue-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-opacity tracking-widest">VIEW CARD</span>
        </div>
      </button>

      {/* 3. PLAYER INFO */}
      <div className="p-3 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <button 
            onClick={onNameClick}
            className="text-left min-w-0 flex-grow group/name focus:outline-none"
          >
            <span className="text-[10px] font-medium text-slate-500 block leading-tight">{player.firstName}</span>
            <h3 className="font-black text-slate-800 leading-tight truncate group-hover:name:text-blue-600 transition-colors">
              {player.lastName}
            </h3>
          </button>
          
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0 uppercase tracking-widest border border-blue-100">
            {player.positions?.[0]?.abbrev || '??'}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
           <span>ETA: {player.prospectEta || '---'}</span>
           <span className="w-0.5 h-0.5 bg-slate-200 rounded-full"></span>
           <span>Age: {player.age || '??'}</span>
        </div>

        {/* 4. PLAYER ACTIONS (Unconfined!) */}
        <div className="mt-3 pt-3 border-t border-slate-100 relative">
           <PlayerActionMenu player={player} isMyTeam={!!isMyTeam} />
        </div>
      </div>
    </div>
  );
}