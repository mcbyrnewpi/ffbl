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
  // Quick debug: If you open your browser console, you'll see exactly why the button is hiding
  if (player.lastName === 'Ohtani') {
    console.log(`Ohtani Check:`, { mlbId: player.mlbId, hasClickProp: !!onLinkClick });
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      {/* COLUMN 1: Player Name, Badges & Subtext */}
      <td className="px-4 md:px-6 py-4">
        <div className="flex items-center gap-2">
          
          <button 
            onClick={onNameClick}
            className="font-bold text-slate-800 hover:text-blue-600 transition-colors text-left"
          >
            {player.firstName} {player.lastName}
          </button>
          
          {/* 🌟 Inline Top 100 Pill */}
          {player.isTop100 && player.prospectRank && (
            <span 
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm" 
              title="Top 100 Prospect"
            >
              <Trophy size={10} className="text-emerald-500" />
              #{player.prospectRank}
            </span>
          )}
          
          {/* THE TRIGGER: Only shows if mlbId is missing AND the view passed the click handler */}
          {!player.mlbId && onLinkClick && (
            <button 
              onClick={onLinkClick}
              className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 p-1 rounded transition-colors"
              title="Missing MLB Profile Link"
            >
              <AlertTriangle size={16} />
            </button>
          )}
        </div>
        
        {/* Positions, Level & ETA Subtext */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-medium mt-1">
          <span>{player.positions?.map((p: any) => p.abbrev).join(' / ') || 'N/A'} — {player.level || 'Unassigned'}</span>
          
          {/* 📅 Inline ETA */}
          {player.prospectEta && (
            <>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 font-bold text-slate-400 tracking-wider" title="Estimated Arrival">
                <Calendar size={10} className="text-slate-400" />
                ETA {player.prospectEta}
              </span>
            </>
          )}
        </div>
      </td>

      {/* COLUMN 2: Status / Trade Lock */}
      <td className="px-4 md:px-6 py-4 text-right">
        <div className="flex justify-end items-center gap-2">
          {/* Status Badge (Active, IL, etc) */}
          <span className="text-xs font-semibold text-slate-600">
            {player.status}
          </span>

          {/* Trade Lock Badge */}
          {player.isTradeLocked ? (
            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-[10px] font-bold border border-amber-100 uppercase flex items-center gap-1">
              <Lock size={10} /> Locked
            </span>
          ) : (
            <PlayerActionMenu player={player} isMyTeam={isMyTeam} />
          )}
        </div>
      </td>
    </tr>
  );
}