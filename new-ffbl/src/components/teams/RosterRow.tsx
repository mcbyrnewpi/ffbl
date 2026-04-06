// src/components/teams/RosterRow.tsx
import { AlertTriangle, Lock, Unlock, Trophy, Calendar } from 'lucide-react';
import PlayerActionMenu from './PlayerActionMenu';

interface RosterRowProps {
  player: any;
  onLinkClick?: () => void;
  onNameClick?: () => void;
  isMyTeam?: boolean; 
}

export default function RosterRow({ player, onLinkClick, onNameClick, isMyTeam }: RosterRowProps) {
  
  // Quick debug check
  if (player.lastName === 'Ohtani') {
    console.log(`Ohtani Check:`, { mlbId: player.mlbId, hasClickProp: !!onLinkClick });
  }

  // 🌟 NEW: Check if this player has a minor league rule violation
  const hasViolation = !!player.violation;

  return (
    <tr className={`transition-colors border-b ${
      hasViolation 
        ? 'bg-red-50 hover:bg-red-100/80 border-red-200' 
        : 'hover:bg-slate-50 border-slate-100'
    }`}>
      {/* COLUMN 1: Player Name, Badges & Subtext */}
      <td className="px-4 md:px-6 py-3">
        <div className="flex items-center gap-2">
          
          <button 
            onClick={onNameClick}
            className={`font-bold transition-colors text-left truncate ${
              hasViolation ? 'text-red-900 hover:text-red-600' : 'text-slate-800 hover:text-blue-600'
            }`}
          >
            {player.firstName} {player.lastName}
          </button>
          
          {/* 🌟 Inline Top 100 Pill */}
          {player.isTop100 && player.prospectRank && (
            <span 
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm shrink-0" 
              title="Top 100 Prospect"
            >
              <Trophy size={10} className="text-emerald-500" />
              #{player.prospectRank}
            </span>
          )}

          {/* 🚨 THE ILLEGAL BADGE 🚨 */}
          {hasViolation && (
             <span 
               className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest bg-red-600 text-white shadow-sm shrink-0 uppercase" 
               title={player.violation}
             >
               <AlertTriangle size={10} strokeWidth={3} />
               Ineligible
             </span>
          )}
          
          {/* THE TRIGGER: Only shows if mlbId is missing AND the view passed the click handler */}
          {!player.mlbId && onLinkClick && (
            <button 
              onClick={onLinkClick}
              className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 p-1 rounded transition-colors shrink-0"
              title="Missing MLB Profile Link"
            >
              <AlertTriangle size={16} />
            </button>
          )}
        </div>
        
        {/* Positions, Level & ETA Subtext */}
        <div className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px] uppercase font-medium mt-1 ${
          hasViolation ? 'text-red-700' : 'text-slate-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-bold">
              {player.positions?.map((p: any) => p.abbrev).join(' / ') || player.mlbRawData?.primaryPosition?.abbreviation || 'N/A'}
            </span>
            <span className="opacity-50">—</span>
            <span>{player.level || 'Unassigned'}</span>
            
            {/* 📅 Inline ETA */}
            {player.prospectEta && (
              <>
                <span className="opacity-30 hidden sm:inline">•</span>
                <span className={`inline-flex items-center gap-1 font-bold tracking-wider ${hasViolation ? 'text-red-600' : 'text-slate-400'}`} title="Estimated Arrival">
                  <Calendar size={10} className={hasViolation ? 'text-red-500' : 'text-slate-400'} />
                  ETA {player.prospectEta}
                </span>
              </>
            )}
          </div>

          {/* 🚨 EXPLANATORY TEXT FOR VIOLATION (Visible on Mobile & Desktop) 🚨 */}
          {hasViolation && (
             <div className="text-[9px] sm:ml-2 font-bold text-red-600 italic bg-red-100/50 px-1.5 py-0.5 rounded border border-red-200/50 mt-1 sm:mt-0 max-w-sm truncate" title={player.violation}>
               {player.violation}
             </div>
          )}
        </div>
      </td>

      {/* COLUMN 2: Status / Trade Lock */}
      <td className="px-4 md:px-6 py-3 text-right w-32">
        <div className="flex justify-end items-center gap-2">
          {/* Status Badge (Active, IL, etc) */}
          <span className={`text-[10px] font-black uppercase tracking-widest ${hasViolation ? 'text-red-800' : 'text-slate-600'}`}>
            {player.status}
          </span>

          {/* Trade Lock Badge */}
          {player.isTradeLocked ? (
            <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded text-[10px] font-bold border border-slate-200 uppercase flex items-center gap-1 shrink-0">
              <Lock size={10} /> Locked
            </span>
          ) : (
            <div className="shrink-0">
              <PlayerActionMenu player={player} isMyTeam={isMyTeam} />
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}