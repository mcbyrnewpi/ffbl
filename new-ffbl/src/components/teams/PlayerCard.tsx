// src/components/teams/PlayerCard.tsx
import PlayerHeadshot from './PlayerHeadshot';
import { AlertTriangle } from 'lucide-react';
import PlayerActionMenu from './PlayerActionMenu';

interface PlayerCardProps {
  player: any;
  onLinkClick?: () => void;
}

export default function PlayerCard({ player, onLinkClick, isMyTeam }: PlayerCardProps) {
  // 1. Dig into the JSON field we just defined
  const rawData = player.mlbRawData as any;
  
  // 2. Prioritize the DB image, fallback to the generic MLB placeholder
  const headshotUrl = rawData?.images?.headshot || 
    `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:brooks:no_headshot.png/w_213,q_auto:best/v1/people/${player.mlbId}/headshot/67/current`;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 group relative">
      
      {/* THE TRIGGER: Floating in the top right over the image */}
      {!player.mlbId && onLinkClick && (
        <div className="absolute top-2 right-2 z-10">
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevents clicking this from triggering other card events
              onLinkClick();
            }}
            className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 p-1.5 rounded-full transition-colors flex items-center gap-1 shadow-md border border-amber-200 bg-white"
            title="Link MLB Profile"
          >
            <AlertTriangle size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div className="relative h-40 overflow-hidden bg-slate-100">
        {/* ⚾ The new smart headshot component */}
        <PlayerHeadshot 
          player={player} 
          className="group-hover:scale-110 transition-transform duration-500" 
        />
        {/* Status Overlay for IL/NA */}
        {player.status !== 'ACTIVE' && (
          <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center z-0">
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase">
              {player.status}
            </span>
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-black text-slate-800 leading-tight truncate pr-2">
            <span className="text-xs font-medium text-slate-500 block mb-0.5">{player.firstName}</span>
            {player.lastName}
          </h3>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
            {player.positions?.[0]?.abbrev || '??'}
          </span>
        </div>
        
        {/* Simple "Card" Stats or Age */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase">
           <span>ETA: {player.prospectEta || '---'}</span>
           <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
           <span>Age: {player.age || '??'}</span>
        </div>
        {/* The Action Menu */}
        <PlayerActionMenu player={player} isMyTeam={isMyTeam} />
      </div>
    </div>
  );
}